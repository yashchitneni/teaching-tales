// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "teaching-tales",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
    };
  },
  async run() {
    // Create VPC for the container infrastructure
    const vpc = new sst.aws.Vpc("TeachingTalesVpc");
    
    // Create ECS Cluster
    const cluster = new sst.aws.Cluster("TeachingTalesCluster", { vpc });

    // Create S3 bucket for file uploads (optional for this app but good to have)
    const bucket = new sst.aws.Bucket("TeachingTalesBucket", {
      access: "public"
    });

    // Create the containerized service
    const service = new sst.aws.Service("TeachingTalesService", {
      cluster,
      loadBalancer: {
        ports: [{ listen: "80/http", forward: "3000/http" }],
      },
      dev: {
        command: "npm run dev",
      },
      link: [bucket],
    });

    return {
      url: service.url,
      bucket: bucket.name,
    };
  },
});
