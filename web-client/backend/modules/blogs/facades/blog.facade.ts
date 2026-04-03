import { BlogAuditObserver, BlogSubject } from "../observers/blog.observer";
import { BlogService } from "../blog.service";
import { BlogDetail, BlogSummary } from "../blog.types";

export class BlogFacade {
  private readonly service = new BlogService();
  private readonly subject = new BlogSubject();

  constructor() {
    this.subject.attach(new BlogAuditObserver());
  }

  async listBlogs(): Promise<BlogSummary[]> {
    return this.service.listPublishedBlogs();
  }

  async getBlog(postId: string): Promise<BlogDetail> {
    const detail = await this.service.getPublishedBlog(postId);

    this.subject.notify({
      postId: detail.post_id,
      event: "viewed",
      viewedAt: new Date().toISOString(),
    });

    return detail;
  }
}

export const blogFacade = new BlogFacade();
