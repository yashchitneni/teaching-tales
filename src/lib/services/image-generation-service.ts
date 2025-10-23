/**
 * Provider-Agnostic Image Generation Service
 * 
 * Provides a unified interface for generating images with multiple providers
 * including Replicate API and local fallback options.
 */

export interface ImageGenerationRequest {
  prompt: string;
  style?: 'cartoon' | 'realistic' | 'illustration' | 'pixel-art';
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3';
  size?: 'small' | 'medium' | 'large';
  seed?: number;
  negativePrompt?: string;
}

export interface ImageGenerationResult {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  imageUrl?: string;
  thumbnailUrl?: string;
  provider: string;
  createdAt: string;
  completedAt?: string;
  error?: string;
  metadata?: {
    prompt: string;
    style?: string;
    processingTimeMs?: number;
    cost?: number;
  };
}

export interface ImageGenerationProgress {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number; // 0-100
  estimatedTimeRemaining?: number; // seconds
  message?: string;
}

export abstract class ImageGenerationProvider {
  abstract readonly name: string;
  abstract readonly isAvailable: boolean;
  abstract readonly maxConcurrentJobs: number;

  abstract generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResult>;
  abstract getJobStatus(jobId: string): Promise<ImageGenerationProgress>;
  abstract cancelJob(jobId: string): Promise<boolean>;
  abstract validateRequest(request: ImageGenerationRequest): { isValid: boolean; errors: string[] };
}

export class ImageGenerationService {
  private providers: ImageGenerationProvider[] = [];
  private activeJobs = new Map<string, { provider: ImageGenerationProvider; startTime: number }>();

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    // Initialize providers in order of preference
    try {
      const replicateProvider = new ReplicateImageProvider();
      if (replicateProvider.isAvailable) {
        this.providers.push(replicateProvider);
      }
    } catch (error) {
      console.warn('Replicate provider not available:', error);
    }

    // Always add local fallback
    this.providers.push(new LocalFallbackProvider());
  }

  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    // Validate request
    const validation = this.validateRequest(request);
    if (!validation.isValid) {
      throw new Error(`Invalid request: ${validation.errors.join(', ')}`);
    }

    // Try providers in order of preference
    for (const provider of this.providers) {
      if (!provider.isAvailable) continue;

      try {
        const result = await provider.generateImage(request);
        this.activeJobs.set(result.id, { provider, startTime: Date.now() });
        
        // Track generation request
        this.trackImageGeneration(result, provider.name);
        
        return result;
      } catch (error) {
        console.warn(`Provider ${provider.name} failed:`, error);
        continue;
      }
    }

    throw new Error('All image generation providers failed');
  }

  async getJobStatus(jobId: string): Promise<ImageGenerationProgress> {
    const job = this.activeJobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    try {
      const status = await job.provider.getJobStatus(jobId);
      
      // Clean up completed/failed jobs
      if (status.status === 'completed' || status.status === 'failed') {
        this.activeJobs.delete(jobId);
      }
      
      return status;
    } catch (error) {
      this.activeJobs.delete(jobId);
      throw error;
    }
  }

  async cancelJob(jobId: string): Promise<boolean> {
    const job = this.activeJobs.get(jobId);
    if (!job) return false;

    try {
      const cancelled = await job.provider.cancelJob(jobId);
      if (cancelled) {
        this.activeJobs.delete(jobId);
      }
      return cancelled;
    } catch (error) {
      console.error(`Failed to cancel job ${jobId}:`, error);
      return false;
    }
  }

  getAvailableProviders(): string[] {
    return this.providers.filter(p => p.isAvailable).map(p => p.name);
  }

  getActiveJobCount(): number {
    return this.activeJobs.size;
  }

  private validateRequest(request: ImageGenerationRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!request.prompt || request.prompt.trim().length === 0) {
      errors.push('Prompt is required');
    }

    if (request.prompt && request.prompt.length > 1000) {
      errors.push('Prompt must be less than 1000 characters');
    }

    if (request.style && !['cartoon', 'realistic', 'illustration', 'pixel-art'].includes(request.style)) {
      errors.push('Invalid style option');
    }

    if (request.aspectRatio && !['1:1', '16:9', '9:16', '4:3'].includes(request.aspectRatio)) {
      errors.push('Invalid aspect ratio');
    }

    if (request.size && !['small', 'medium', 'large'].includes(request.size)) {
      errors.push('Invalid size option');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private trackImageGeneration(result: ImageGenerationResult, providerName: string): void {
    // Track image generation for analytics
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', 'image_generation_started', {
        provider: providerName,
        job_id: result.id,
        prompt_length: result.metadata?.prompt?.length || 0
      });
    }
  }
}

// Replicate Provider Implementation
class ReplicateImageProvider extends ImageGenerationProvider {
  readonly name = 'replicate';
  readonly maxConcurrentJobs = 3;

  get isAvailable(): boolean {
    return !!(process.env.NEXT_PUBLIC_REPLICATE_API_TOKEN || process.env.REPLICATE_API_TOKEN);
  }

  private get apiToken(): string {
    const token = process.env.NEXT_PUBLIC_REPLICATE_API_TOKEN || process.env.REPLICATE_API_TOKEN;
    if (!token) throw new Error('Replicate API token not configured');
    return token;
  }

  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    const validation = this.validateRequest(request);
    if (!validation.isValid) {
      throw new Error(`Invalid request: ${validation.errors.join(', ')}`);
    }

    const startTime = Date.now();
    
    // Build Replicate-specific prompt
    const enhancedPrompt = this.buildEnhancedPrompt(request);
    
    const replicateRequest = {
      version: "ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e93", // SDXL model
      input: {
        prompt: enhancedPrompt,
        negative_prompt: request.negativePrompt || "blurry, low quality, distorted, nsfw",
        width: this.getSizeFromRequest(request).width,
        height: this.getSizeFromRequest(request).height,
        num_inference_steps: 25,
        guidance_scale: 7.5,
        seed: request.seed
      }
    };

    try {
      const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(replicateRequest)
      });

      if (!response.ok) {
        throw new Error(`Replicate API error: ${response.status} ${response.statusText}`);
      }

      const prediction = await response.json();

      return {
        id: prediction.id,
        status: this.mapReplicateStatus(prediction.status),
        provider: this.name,
        createdAt: new Date().toISOString(),
        metadata: {
          prompt: request.prompt,
          style: request.style,
          processingTimeMs: Date.now() - startTime
        }
      };
    } catch (error) {
      throw new Error(`Replicate generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getJobStatus(jobId: string): Promise<ImageGenerationProgress> {
    try {
      const response = await fetch(`https://api.replicate.com/v1/predictions/${jobId}`, {
        headers: {
          'Authorization': `Token ${this.apiToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Replicate status check failed: ${response.status}`);
      }

      const prediction = await response.json();
      
      return {
        id: jobId,
        status: this.mapReplicateStatus(prediction.status),
        progress: this.estimateProgress(prediction.status),
        message: prediction.status === 'failed' ? prediction.error : undefined
      };
    } catch (error) {
      throw new Error(`Status check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async cancelJob(jobId: string): Promise<boolean> {
    try {
      const response = await fetch(`https://api.replicate.com/v1/predictions/${jobId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${this.apiToken}`
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to cancel Replicate job:', error);
      return false;
    }
  }

  validateRequest(request: ImageGenerationRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!request.prompt) {
      errors.push('Prompt is required');
    }

    if (request.prompt && request.prompt.length > 500) {
      errors.push('Replicate prompts must be less than 500 characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private buildEnhancedPrompt(request: ImageGenerationRequest): string {
    let prompt = request.prompt;

    // Add style modifiers
    if (request.style) {
      const styleModifiers = {
        cartoon: ', cartoon style, animated, colorful, child-friendly',
        realistic: ', photorealistic, detailed, high quality',
        illustration: ', digital illustration, artistic, detailed',
        'pixel-art': ', pixel art style, 8-bit, retro gaming aesthetic'
      };
      prompt += styleModifiers[request.style];
    }

    // Add quality enhancers
    prompt += ', high quality, detailed, professional';

    return prompt;
  }

  private getSizeFromRequest(request: ImageGenerationRequest): { width: number; height: number } {
    const sizeMap = {
      small: { width: 512, height: 512 },
      medium: { width: 768, height: 768 },
      large: { width: 1024, height: 1024 }
    };

    const baseSize = sizeMap[request.size || 'medium'];

    // Adjust for aspect ratio
    if (request.aspectRatio === '16:9') {
      return { width: Math.round(baseSize.width * 1.33), height: baseSize.height };
    } else if (request.aspectRatio === '9:16') {
      return { width: baseSize.width, height: Math.round(baseSize.height * 1.33) };
    } else if (request.aspectRatio === '4:3') {
      return { width: Math.round(baseSize.width * 1.15), height: baseSize.height };
    }

    return baseSize; // 1:1 default
  }

  private mapReplicateStatus(status: string): ImageGenerationResult['status'] {
    switch (status) {
      case 'starting':
      case 'processing':
        return 'processing';
      case 'succeeded':
        return 'completed';
      case 'failed':
      case 'canceled':
        return 'failed';
      default:
        return 'pending';
    }
  }

  private estimateProgress(status: string): number {
    switch (status) {
      case 'starting':
        return 10;
      case 'processing':
        return 50;
      case 'succeeded':
        return 100;
      case 'failed':
      case 'canceled':
        return 0;
      default:
        return 0;
    }
  }
}

// Local Fallback Provider Implementation
class LocalFallbackProvider extends ImageGenerationProvider {
  readonly name = 'local-fallback';
  readonly isAvailable = true;
  readonly maxConcurrentJobs = 10;

  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    const jobId = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Simulate processing time
    const processingTime = 1000 + Math.random() * 2000; // 1-3 seconds
    
    setTimeout(() => {
      // Generate placeholder image URL
      const placeholderUrl = this.generatePlaceholderUrl(request);
      
      // In a real implementation, this would trigger a callback or update a job store
      console.log(`Local fallback image generated: ${placeholderUrl}`);
    }, processingTime);

    return {
      id: jobId,
      status: 'processing',
      provider: this.name,
      createdAt: new Date().toISOString(),
      metadata: {
        prompt: request.prompt,
        style: request.style
      }
    };
  }

  async getJobStatus(jobId: string): Promise<ImageGenerationProgress> {
    // Simulate completion after a short delay
    const isCompleted = Math.random() > 0.3; // 70% chance of completion
    
    if (isCompleted) {
      return {
        id: jobId,
        status: 'completed',
        progress: 100
      };
    }

    return {
      id: jobId,
      status: 'processing',
      progress: Math.floor(Math.random() * 80) + 10, // 10-90%
      estimatedTimeRemaining: Math.floor(Math.random() * 30) + 5 // 5-35 seconds
    };
  }

  async cancelJob(jobId: string): Promise<boolean> {
    // Local jobs can always be "cancelled"
    return true;
  }

  validateRequest(request: ImageGenerationRequest): { isValid: boolean; errors: string[] } {
    // Local fallback is very permissive
    return {
      isValid: !!request.prompt,
      errors: request.prompt ? [] : ['Prompt is required']
    };
  }

  private generatePlaceholderUrl(request: ImageGenerationRequest): string {
    // Generate a placeholder image URL based on the request
    const size = request.size === 'large' ? '1024x1024' : request.size === 'small' ? '512x512' : '768x768';
    const text = encodeURIComponent(request.prompt.substring(0, 50));
    const bgColor = this.getColorForStyle(request.style);
    
    return `https://via.placeholder.com/${size}/${bgColor}/ffffff?text=${text}`;
  }

  private getColorForStyle(style?: string): string {
    const colors = {
      cartoon: 'FFB6C1',
      realistic: '8FBC8F',
      illustration: 'DDA0DD',
      'pixel-art': '87CEEB'
    };
    
    return colors[style as keyof typeof colors] || 'CCCCCC';
  }
}

// Export singleton instance
export const imageGenerationService = new ImageGenerationService();
