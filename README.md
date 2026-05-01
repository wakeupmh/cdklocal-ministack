# cdklocal-ministack

Minimal example of deploying an AWS CDK stack to [MiniStack](https://github.com/ministackorg/ministack) using [cdklocal](https://github.com/localstack/aws-cdk-local) and Podman.

**What it creates:**

- An SQS queue (`demo-queue`)
- A Node.js 20 Lambda function (`demo-consumer`) wired as a queue consumer via an SQS event-source mapping

## Prerequisites

- [Node.js 20+](https://nodejs.org)
- [Podman](https://podman.io) with `podman compose` (or `podman-compose`)
- AWS CLI tools:

```bash
npm install -g aws-cdk aws-cdk-local
pip install awscli-local
```

## Run

### 1. Start the Podman socket (rootless Podman only)

MiniStack needs a Docker-API socket to run Lambda containers. With rootless Podman, expose it once per session:

```bash
systemctl --user start podman.socket
```

### 2. Start MiniStack

```bash
podman compose up -d
```

Verify it's healthy:

```bash
curl http://localhost:4566/_ministack/health
```

### 3. Install dependencies

```bash
npm install
```

### 4. Export local AWS credentials

```bash
export AWS_ENDPOINT_URL=http://localhost:4566
export AWS_DEFAULT_REGION=us-east-1
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
```

### 5. Bootstrap and deploy

```bash
cdklocal bootstrap
cdklocal deploy --require-approval never
```

The deploy output shows the queue URL and function name:

```
Outputs:
MinistackStack.QueueUrl   = http://localhost:4566/000000000000/demo-queue
MinistackStack.FunctionName = demo-consumer
```

## Test

Send a message to the queue:

```bash
awslocal sqs send-message \
  --queue-url http://localhost:4566/000000000000/demo-queue \
  --message-body "hello from ministack"
```

Tail the Lambda logs to see it processed:

```bash
awslocal logs tail /aws/lambda/demo-consumer --follow
```

Expected output:

```
Received message: hello from ministack
```

## Teardown

```bash
cdklocal destroy --force
podman compose down
```

## How it works

```
┌──────────────────────────────────────────────────────┐
│  MiniStack (localhost:4566)                          │
│                                                      │
│  SQS demo-queue ──► Lambda demo-consumer             │
│                          │                           │
│                          └── console.log(message)    │
└──────────────────────────────────────────────────────┘
        ▲
        │  cdklocal deploy (AWS_ENDPOINT_URL=localhost:4566)
        │
   CDK TypeScript app
```

`cdklocal` is a thin wrapper around `cdk` that points CloudFormation calls at the local endpoint instead of real AWS. MiniStack implements the AWS APIs locally, so the same CDK code works against both MiniStack and production AWS.
