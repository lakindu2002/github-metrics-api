import * as cdk from "aws-cdk-lib";
import { KubectlV26Layer } from "@aws-cdk/lambda-layer-kubectl-v26";
import { Construct } from "constructs";
import { RabbitMqK8Stack } from "../k8/rabbitmq";
import { CommitsStack } from "../k8/commits";
import { IssuesStack } from "../k8/issues";
import { ConsumerStack } from "../k8/consumer";
import { PullsStack } from "../k8/pulls";
import { ReposStack } from "../k8/repos";
import { SchedulerStack } from "../k8/scheduler";
import { IngressStack } from "../k8/ingress";

interface EksStackProps extends cdk.StackProps {
  tableNames: { commits: string; pulls: string; issues: string };
  iam: { secret: string; access: string };
}

export class EksStack extends cdk.Stack {
  public readonly cluster: cdk.aws_eks.FargateCluster;

  constructor(scope: Construct, id: string, props: EksStackProps) {
    super(scope, id, props);

    const {
      tableNames: { commits, issues, pulls },
      iam: { access, secret },
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
      kubectlLayer: new KubectlV26Layer(this, "Kubectlv26Layer"),
      mastersRole: masterRole,
      albController: {
        version: cdk.aws_eks.AlbControllerVersion.V2_5_1,
        repository:
          "602401143452.dkr.ecr.us-west-2.amazonaws.com/amazon/aws-load-balancer-controller",
      },
      outputClusterName: true,
      outputConfigCommand: true,
      outputMastersRoleArn: true,
      clusterLogging: [
        cdk.aws_eks.ClusterLoggingTypes.API,
        cdk.aws_eks.ClusterLoggingTypes.AUDIT,
        cdk.aws_eks.ClusterLoggingTypes.AUTHENTICATOR,
        cdk.aws_eks.ClusterLoggingTypes.CONTROLLER_MANAGER,
        cdk.aws_eks.ClusterLoggingTypes.SCHEDULER,
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

    const rabbitMqStack = new RabbitMqK8Stack(this, "RabbbitMqStack", {
      ...props,
      cluster: this.cluster,
    });

    const commitsStack = new CommitsStack(this, "CommitStack", {
      ...props,
      cluster: this.cluster,
      commitTable: commits,
      accessKey: access,
      secretAccessKey: secret,
    });
    commitsStack.addDependency(rabbitMqStack);

    const issuesStack = new IssuesStack(this, "IssuesStack", {
      ...props,
      cluster: this.cluster,
      issuesTableName: issues,
      accessKey: access,
      secretAccessKey: secret,
    });

    issuesStack.addDependency(rabbitMqStack);

    const pullsStack = new PullsStack(this, "PullsStack", {
      ...props,
      cluster: this.cluster,
      pullsTable: pulls,
      accessKey: access,
      secretAccessKey: secret,
    });

    pullsStack.addDependency(rabbitMqStack);

    const consumerStack = new ConsumerStack(this, "ConsumerStack", {
      ...props,
      cluster: this.cluster,
      accessKey: access,
      secretAccessKey: secret,
    });

    consumerStack.addDependency(rabbitMqStack);

    const reposStack = new ReposStack(this, "ReposStack", {
      ...props,
      cluster: this.cluster,
      accessKey: access,
      secretAccessKey: secret,
    });

    reposStack.addDependency(rabbitMqStack);

    const schedulerStack = new SchedulerStack(this, "SchedulerStack", {
      ...props,
      cluster: this.cluster,
      accessKey: access,
      secretAccessKey: secret,
    });

    schedulerStack.addDependency(rabbitMqStack);

    const ingress = new IngressStack(this, "IngressStack", {
      ...props,
      cluster: this.cluster,
      ports: { consumer: 3006 },
      subnets: this.cluster.vpc.publicSubnets.map((subnet) => subnet.subnetId),
    });

    if (this.cluster.albController) {
      ingress.node.addDependency(this.cluster.albController);
    }
  }
}
