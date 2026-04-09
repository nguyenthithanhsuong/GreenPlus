export interface CommunityPostMediaStorageStrategy {
  getTableName(): string;
}

class DefaultCommunityPostMediaStorageStrategy implements CommunityPostMediaStorageStrategy {
  getTableName(): string {
    return "post_medias";
  }
}

export function createCommunityPostMediaStorageStrategy(): CommunityPostMediaStorageStrategy {
  return new DefaultCommunityPostMediaStorageStrategy();
}
