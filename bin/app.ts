#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MinistackStack } from '../lib/ministack-stack';

const app = new cdk.App();
new MinistackStack(app, 'MinistackStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'us-east-1' },
});
