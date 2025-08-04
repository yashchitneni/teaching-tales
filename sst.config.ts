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

    // Get Supabase configuration from environment or secrets
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || $secret("NEXT_PUBLIC_SUPABASE_URL");
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || $secret("NEXT_PUBLIC_SUPABASE_ANON_KEY");
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

    // Create the Next.js app
    const site = new sst.aws.Nextjs("TeachingTalesApp", {
      link: [bucket],
      environment: {
        NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey,
        SUPABASE_SERVICE_ROLE_KEY: supabaseServiceKey,
      },
    });

    return {
      url: site.url,
      bucket: bucket.name,
    };
  },
});
