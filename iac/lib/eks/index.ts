import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { RabbitMqK8Stack } from "../k8/rabbitmq";
import { CommitsStack } from "../k8/commits";
import { IssuesStack } from "../k8/issues";
import { ConsumerStack } from "../k8/consumer";
import { PullsStack } from "../k8/pulls";
import { ReposStack } from "../k8/repos";
import { SchedulerStack } from "../k8/scheduler";

interface EksStackProps extends cdk.StackProps {
  tables: { commits: string; pulls: string; issues: string };
}

export class EksStack extends cdk.Stack {
  public readonly cluster: cdk.aws_eks.FargateCluster;
  private readonly ingressControllerName = "ingress-controller";

  constructor(scope: Construct, id: string, props: EksStackProps) {
    super(scope, id, props);

    const {
      tables: { commits, issues, pulls },
    } = props;

    const masterRole = new cdk.aws_iam.Role(this, "MasterRole", {
      assumedBy: new cdk.aws_iam.CompositePrincipal(
        new cdk.aws_iam.ServicePrincipal("eks.amazonaws.com"),
        new cdk.aws_iam.AnyPrincipal()
      ),
    });

    masterRole.addManagedPolicy(
      cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName("AdministratorAccess")
    );

    const readonlyRole = new cdk.aws_iam.Role(this, "ReadOnlyRole", {
      assumedBy: new cdk.aws_iam.CompositePrincipal(
        new cdk.aws_iam.ServicePrincipal("eks.amazonaws.com"),
        new cdk.aws_iam.AnyPrincipal()
      ),
    });

    readonlyRole.addManagedPolicy(
      cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName("AdministratorAccess")
    );

    this.cluster = new cdk.aws_eks.FargateCluster(this, "DeveloperIQ", {
      version: cdk.aws_eks.KubernetesVersion.V1_26,
      clusterName: "DeveloperIQ",
      mastersRole: masterRole,
      clusterLogging: [
        cdk.aws_eks.ClusterLoggingTypes.API,
        cdk.aws_eks.ClusterLoggingTypes.AUDIT,
      ],
    });

    masterRole.grantAssumeRole(this.cluster.adminRole);

    this.cluster.awsAuth.addRoleMapping(readonlyRole, {
      groups: ["system:authenticated"],
    });

    this.cluster.addManifest("ClusterRole", {
      apiVersion: "rbac.authorization.k8s.io/v1",
      kind: "ClusterRole",
      metadata: {
        name: "eks-access-cluster-role",
        namespace: "kube-system",
      },
      rules: [
        {
          apiGroups: [""],
          resources: [
            "configmaps",
            "services",
            "pods",
            "persistentvolumes",
            "namespaces",
          ],
          verbs: ["get", "list", "watch"],
        },
        {
          apiGroups: [""],
          resources: ["pods/log"],
          verbs: ["get", "list"],
        },
        {
          apiGroups: [""],
          resources: ["pods/portforward", "services/portforward"],
          verbs: ["create"],
        },
      ],
    });

    this.cluster.addManifest("ClusterRoleBinding", {
      apiVersion: "rbac.authorization.k8s.io/v1",
      kind: "ClusterRoleBinding",
      metadata: {
        name: "iam-cluster-role-binding",
        namespace: "kube-system",
      },
      roleRef: {
        apiGroup: "rbac.authorization.k8s.io",
        kind: "ClusterRole",
        name: "eks-access-cluster-role",
      },
      subjects: [
        {
          kind: "User",
          name: readonlyRole.roleArn,
          apiGroup: "rbac.authorization.k8s.io",
        },
      ],
    });

    const ingressControllerChart = this.cluster.addHelmChart(
      "IngressController",
      {
        chart: "nginx-ingress",
        repository: "https://helm.nginx.com/stable",
        release: this.ingressControllerName, // Make service name predictable
      }
    );

    const rabbitMqStack = new RabbitMqK8Stack(this, "RabbbitMqStack", {
      ...props,
      cluster: this.cluster,
    });

    const commitsStack = new CommitsStack(this, "CommitStack", {
      ...props,
      cluster: this.cluster,
      commitTable: commits,
    });
    commitsStack.addDependency(rabbitMqStack);

    const issuesStack = new IssuesStack(this, "IssuesStack", {
      ...props,
      cluster: this.cluster,
      issuesTableName: issues,
    });

    issuesStack.addDependency(rabbitMqStack);

    const pullsStack = new PullsStack(this, "PullsStack", {
      ...props,
      cluster: this.cluster,
      pullsTable: pulls,
    });

    pullsStack.addDependency(rabbitMqStack);

    const consumerStack = new ConsumerStack(this, "ConsumerStack", {
      ...props,
      cluster: this.cluster,
    });

    consumerStack.addDependency(rabbitMqStack);

    const reposStack = new ReposStack(this, "ReposStack", {
      ...props,
      cluster: this.cluster,
    });

    reposStack.addDependency(rabbitMqStack);

    const schedulerStack = new SchedulerStack(this, "SchedulerStack", {
      ...props,
      cluster: this.cluster,
    });

    schedulerStack.addDependency(rabbitMqStack);
  }
}
