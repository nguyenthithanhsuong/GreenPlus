import { GreenCreatorContentRepository } from "./greencreator-content.repository";
import { GreenCreatorContentService } from "./greencreator-content.service";
import { GreenCreatorPostRow, GreenCreatorPostStatus } from "./greencreator-content.types";

export class GreenCreatorContentFacade {
  private readonly repository = new GreenCreatorContentRepository();
  private readonly service = new GreenCreatorContentService(this.repository);

  async listPosts(): Promise<GreenCreatorPostRow[]> {
    return this.service.listPosts();
  }

  async changeStatus(postId: string, status: GreenCreatorPostStatus): Promise<GreenCreatorPostRow> {
    return this.service.changeStatus(postId, status);
  }
}

export const greenCreatorContentFacade = new GreenCreatorContentFacade();
