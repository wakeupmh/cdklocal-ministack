import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import { Construct } from 'constructs';

export class MinistackStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const queue = new sqs.Queue(this, 'DemoQueue', {
      queueName: 'demo-queue',
      visibilityTimeout: cdk.Duration.seconds(30),
    });

    const consumer = new lambda.Function(this, 'DemoConsumer', {
      functionName: 'demo-consumer',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler.main',
      code: lambda.Code.fromAsset('lambda'),
      timeout: cdk.Duration.seconds(10),
    });

    consumer.addEventSource(
      new lambdaEventSources.SqsEventSource(queue, { batchSize: 5 }),
    );

    new cdk.CfnOutput(this, 'QueueUrl', {
      value: queue.queueUrl,
      description: 'SQS queue URL — use with: awslocal sqs send-message --queue-url <url> --message-body "hello"',
    });

    new cdk.CfnOutput(this, 'FunctionName', {
      value: consumer.functionName,
      description: 'Lambda name — use with: awslocal logs tail /aws/lambda/<name> --follow',
    });
  }
}
