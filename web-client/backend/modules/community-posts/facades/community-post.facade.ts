import {
  CommunityPostAuditObserver,
  CommunityPostSubject,
} from "../observers/community-post.observer";
import { CommunityPostService } from "../community-post.service";
import {
  CommunityPostSummary,
  CommunityPostCreatedResult,
  CreateCommunityPostInput,
  DeleteCommunityPostInput,
  UploadCommunityAttachmentInput,
  UploadCommunityAttachmentResult,
  UpdateCommunityPostInput,
} from "../community-post.types";

export class CommunityPostFacade {
  private readonly service = new CommunityPostService();
  private readonly subject = new CommunityPostSubject();

  constructor() {
    this.subject.attach(new CommunityPostAuditObserver());
  }

  async createPost(input: CreateCommunityPostInput): Promise<CommunityPostCreatedResult> {
    const result = await this.service.createPost(input);

    this.subject.notify({
      postId: result.post_id,
      event: "created",
      changedAt: new Date().toISOString(),
    });

    return result;
  }

  async listPostsByUser(userId: string): Promise<CommunityPostSummary[]> {
    return this.service.listPostsByUser(userId);
  }

  async listAllPosts(): Promise<CommunityPostSummary[]> {
    return this.service.listAllPosts();
  }

  async updatePost(input: UpdateCommunityPostInput): Promise<CommunityPostSummary> {
    const result = await this.service.updatePost(input);

    this.subject.notify({
      postId: result.post_id,
      event: "updated",
      changedAt: new Date().toISOString(),
    });

    return result;
  }

  async deletePost(input: DeleteCommunityPostInput): Promise<void> {
    await this.service.deletePost(input);

    this.subject.notify({
      postId: input.postId,
      event: "deleted",
      changedAt: new Date().toISOString(),
    });
  }

  async uploadAttachment(input: UploadCommunityAttachmentInput): Promise<UploadCommunityAttachmentResult> {
    return this.service.uploadAttachment(input);
  }
}

export const communityPostFacade = new CommunityPostFacade();
