import { GreenCreatorContentRepository } from "./greencreator-content.repository";
import { GreenCreatorContentService } from "./greencreator-content.service";
import {
  CreateGreenCreatorPostInput,
  GreenCreatorPostRow,
  GreenCreatorPostStatus,
  UploadGreenCreatorAttachmentInput,
  UploadGreenCreatorAttachmentResult,
} from "./greencreator-content.types";

export class GreenCreatorContentFacade {
  private readonly repository = new GreenCreatorContentRepository();
  private readonly service = new GreenCreatorContentService(this.repository);

  async listPosts(): Promise<GreenCreatorPostRow[]> {
    return this.service.listPosts();
  }

  async changeStatus(postId: string, status: GreenCreatorPostStatus): Promise<GreenCreatorPostRow> {
    return this.service.changeStatus(postId, status);
  }

  async createPost(input: CreateGreenCreatorPostInput): Promise<GreenCreatorPostRow> {
    return this.service.createPost(input);
  }

  async deletePost(postId: string, force = false): Promise<void> {
    await this.service.deletePost(postId, force);
  }

  async uploadAttachment(input: UploadGreenCreatorAttachmentInput): Promise<UploadGreenCreatorAttachmentResult> {
    return this.service.uploadAttachment(input);
  }
}

export const greenCreatorContentFacade = new GreenCreatorContentFacade();
