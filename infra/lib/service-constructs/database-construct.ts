import { Construct } from 'constructs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Duration, RemovalPolicy } from 'aws-cdk-lib';

export class DatabaseConstruct extends Construct {
	public readonly cluster: rds.DatabaseCluster;
	public readonly securityGroup: ec2.SecurityGroup;

	constructor(scope: Construct, id: string, vpc: ec2.IVpc) {
		super(scope, id);

		this.securityGroup = new ec2.SecurityGroup(this, 'AuroraSecurityGroup', {
			vpc,
			allowAllOutbound: true,
			description: 'Security group for Aurora PostgreSQL',
		});

		this.cluster = new rds.DatabaseCluster(this, 'ContextSpaceAuroraCluster', {
			engine: rds.DatabaseClusterEngine.auroraPostgres({
				version: rds.AuroraPostgresEngineVersion.VER_16_4,
			}),

			writer: rds.ClusterInstance.serverlessV2('writer'),
			vpc,
			securityGroups: [this.securityGroup],
			credentials: rds.Credentials.fromGeneratedSecret('postgres'),
			defaultDatabaseName: 'contextspace',
			serverlessV2MinCapacity: 0.5,
			serverlessV2MaxCapacity: 2,
			backup: {
				retention: Duration.days(7),
			},
			removalPolicy: RemovalPolicy.DESTROY,
			deletionProtection: false,
		});
	}
}
