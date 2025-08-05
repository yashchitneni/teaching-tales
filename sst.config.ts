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
    // Create S3 bucket for file uploads
    const bucket = new sst.aws.Bucket("TeachingTalesBucket", {
      access: "public"
    });

    // Get TimeBack configuration from environment or secrets
const timebackApiUrl = process.env.NEXT_PUBLIC_TIMEBACK_API_URL || "http://localhost:8080";

    // Create the Next.js app
    const site = new sst.aws.Nextjs("TeachingTalesApp", {
      link: [bucket],
      environment: {
        NEXT_PUBLIC_TIMEBACK_API_URL: timebackApiUrl,
      },
    });

    return {
      url: site.url,
      bucket: bucket.name,
    };
  },
});
