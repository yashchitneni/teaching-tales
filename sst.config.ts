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
  async run(input) {
    // Create S3 bucket for file uploads
    const bucket = new sst.aws.Bucket("TeachingTalesBucket", {
      access: "public"
    });

    // Get TimeBack configuration from environment or secrets
    // Use different URLs based on stage
    const timebackApiUrl = $app.stage === "production" 
      ? "https://core.timebackapi.com"
      : process.env.NEXT_PUBLIC_TIMEBACK_API_URL || "http://localhost:8080";

    // Create secrets
    const googleAiApiKey = new sst.Secret("GOOGLE_AI_API_KEY");
    const replicateApiKey = new sst.Secret("REPLICATE_API_TOKEN");

    // Create the Next.js app
    const site = new sst.aws.Nextjs("TeachingTalesApp", {
      link: [bucket, googleAiApiKey, replicateApiKey],
      timeout: "2 minutes", // Max allowed by CloudFront
      memory: "2 GB", // Increase memory for better performance
      build: {
        command: "npm run build",
      },
      server: {
        timeout: "2 minutes", // Max allowed by CloudFront
      },
      environment: {
        NEXT_PUBLIC_TIMEBACK_API_URL: timebackApiUrl,
        GEMINI_MODEL_NAME: 'gemini-2.0-flash',
        GEMINI_MAX_TOKENS: '4096',
        REPLICATE_MODEL: 'black-forest-labs/flux-schnell',
        // Feature flags (default to false for safety)
        QTI_SPLIT_GENERATION_ENABLED: 'false',
        NEXT_PUBLIC_QTI_SPLIT_GENERATION: 'false',
      },
    });

    return {
      url: site.url,
      bucket: bucket.name,
    };
  },
});
