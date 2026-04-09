import {
  CreateCommunityPostInteractionInput,
  DeleteCommunityPostInteractionInput,
  CommunityPostInteractionSummary,
  UpdateCommunityPostInteractionInput,
} from "../community-post.types";
import { communityPostInteractionService } from "../community-post-interaction.service";

export class CommunityPostInteractionFacade {
  async listByPostId(postId: string): Promise<CommunityPostInteractionSummary[]> {
    return communityPostInteractionService.listByPostId(postId);
  }

  async addInteraction(input: CreateCommunityPostInteractionInput): Promise<CommunityPostInteractionSummary | null> {
    return communityPostInteractionService.addInteraction(input);
  }

  async editComment(input: UpdateCommunityPostInteractionInput): Promise<CommunityPostInteractionSummary> {
    return communityPostInteractionService.editComment(input);
  }

  async deleteInteraction(input: DeleteCommunityPostInteractionInput): Promise<{ success: true }> {
    return communityPostInteractionService.deleteInteraction(input);
  }
}

export const communityPostInteractionFacade = new CommunityPostInteractionFacade();