import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IPaginationOptions, paginate, Pagination } from 'nestjs-typeorm-paginate';
import { CommentService } from 'src/comment/comment.service';
import { IsNull, Repository } from 'typeorm';
import { CreateCommunityDto } from './dto/create-community.dto';
import { UpdateCommunityDto } from './dto/update-community.dto';
import { Community } from './entities/community.entity';
import { CommunityLike } from './entities/community.like.entity';
import { CommunitySummary } from './entities/community.summary.entity';
import { CommunityMapper } from './util/community.mapper';

@Injectable()
export class CommunityService {

  constructor(
    @InjectRepository(Community) private communityRepository: Repository<Community>,
    @InjectRepository(CommunitySummary) private communitySummaryRepository: Repository<CommunitySummary>,
    @InjectRepository(CommunityLike) private communityLikeRepository: Repository<CommunityLike>,
    @Inject(forwardRef(() => CommentService))
    private readonly commentService: CommentService,
    private readonly communityMapper: CommunityMapper
  ) {}

  async toggleLike(communityId: number, userId: number):  Promise<any> {
    let like: CommunityLike = await this.communityLikeRepository.findOneBy({
      communityId: communityId, userId: userId
    });
    if (Boolean(like)) {
      like.isLiked = like.isLiked == true ? false : true;
      await this.communityLikeRepository.save(like);
    }
    else {
      like = new CommunityLike();
      like.communityId = communityId;
      like.userId = userId;
      like.isLiked = true;
      await this.communityLikeRepository.save(like);
    }
    let community: Community = await this.findOneNoViewsIncreaseWithoutLikeRelations(like.communityId);
    community.likes = await this.findLikeCount(like.communityId);
    await this.communityRepository.save(community);
    return like;
  }

  async findLikeCount(communityId: number): Promise<number> {
    let count: number = await this.communityLikeRepository.countBy({
      communityId: communityId, isLiked: true
    });
    return count;
  }

  async findIsLiked(communityId: number, userId: number): Promise<boolean> {
    let like: CommunityLike = await this.communityLikeRepository.findOneBy({
      communityId: communityId, userId: userId
    });
    if (like == null) return false;
    return like.isLiked;
  }

  async create(createCommunityDto: CreateCommunityDto, creatorId: number): Promise<any> {
    let community: Community = this.communityMapper.createDtoToEntity(createCommunityDto);
    community.creatorId = creatorId;
    let created = await this.communityRepository.save(community);
    return await this.findOneNoViewsIncrease(created.id, creatorId);
  }

  async findAll(options: IPaginationOptions, userId: number): Promise<Pagination<CommunitySummary>> {
    let queryBuilder = this.communitySummaryRepository.createQueryBuilder('cs');
    queryBuilder
      .where('cs.deletedAt IS NULL')
      .orderBy({'createdAt': "DESC"})
      ;
    let paginated: Pagination<any> = await paginate(queryBuilder, options);
    for (let communitySummary of paginated.items) {
      communitySummary.isLiked = await this.findIsLiked(communitySummary.id, userId);
    }
    return paginated;
  }

  async findAllByTag(options: IPaginationOptions, tag: string, userId: number): Promise<Pagination<CommunitySummary>> {
    let queryBuilder = this.communitySummaryRepository.createQueryBuilder('cs');
    queryBuilder
      .where('cs.deletedAt IS NULL')
      .andWhere('cs.tag = :tag', { tag: tag })
      .addOrderBy('createdAt', 'DESC')
      ;
    let paginated: Pagination<any> = await paginate(queryBuilder, options);
    for (let communitySummary of paginated.items) {
      communitySummary.isLiked = await this.findIsLiked(communitySummary.id, userId);
    }
    return paginated;
  }

  async findAllWithoutLikeRelations(options: IPaginationOptions): Promise<Pagination<CommunitySummary>> {
    let queryBuilder = this.communitySummaryRepository.createQueryBuilder('cs');
    queryBuilder
      .where('cs.deletedAt IS NULL')
      .addOrderBy('createdAt', 'DESC')
      ;
    let paginated: Pagination<any> = await paginate(queryBuilder, options);
    return paginated;
  }

  async findAllByTagWithoutLikeRelations(options: IPaginationOptions, tag: string): Promise<Pagination<CommunitySummary>> {
    let queryBuilder = this.communitySummaryRepository.createQueryBuilder('cs');
    queryBuilder
      .where('cs.deletedAt IS NULL')
      .andWhere('cs.tag = :tag', { tag: tag })
      .addOrderBy('createdAt', 'DESC')
      ;
    let paginated: Pagination<any> = await paginate(queryBuilder, options);
    return paginated;
  }

  async findOne(id: number, userId: number): Promise<any> {
    let community: Community = await this.communityRepository.findOneByOrFail({
      id: id, deletedAt: IsNull()
    });
    community.views++;
    await this.communityRepository.save(community);
    let result: any = await this.communityRepository.findOneOrFail({
      where: {
        id: id, deletedAt: IsNull()
      },
      relations: {
        comments: {
          
        }
      }
    });
    result.isLiked = await this.findIsLiked(id, userId);
    for (let comment of result.comments) {
      comment.isLiked = await this.commentService.findIsLiked(comment.id, userId);
    }
    return result;
  }

  async findOneWithoutLikeRelations(id: number): Promise<Community> {
    let community: any = await this.communityRepository.findOneByOrFail({
      id: id, deletedAt: IsNull()
    });
    community.views++;
    await this.communityRepository.save(community);
    return await this.communityRepository.findOneOrFail({
      where: {
        id: id, deletedAt: IsNull()
      },
      relations: {
        comments: true
      }
    });
  }

  async findOneNoViewsIncrease(id: number, creatorId: number): Promise<any> {
    let result: any = await this.communityRepository.findOneOrFail({
      where: {
        id: id, deletedAt: IsNull()
      },
      relations: {
        comments: true
      }
    });
    result.isLiked = await this.findIsLiked(id, creatorId);
    for (let comment of result.comments) {
      if (comment.deletedAt != null) {
        result.comments.remove(comment);
      }
      comment.isLiked = await this.commentService.findIsLiked(comment.id, creatorId);
    }
    return result;
  }

  async findOneNoViewsIncreaseWithoutLikeRelations(id: number): Promise<Community> {
    let result: any = await this.communityRepository.findOneOrFail({
      where: {
        id: id, deletedAt: IsNull()
      },
      relations: {
        comments: true
      }
    });
    return result;
  }


  async update(id: number, updateCommunityDto: UpdateCommunityDto, userId: number): Promise<any> {
    let community = await this.findOneNoViewsIncrease(id, userId);
    this.communityMapper.updateDtoToEntity(updateCommunityDto, community);
    await this.communityRepository.save(community);
    return await this.findOneNoViewsIncrease(id, userId);
  }

  async remove(id: number, userId: number): Promise<void> {
    let community: Community = await this.findOneNoViewsIncrease(id, userId);
    community.deletedAt = new Date().getTime() + "";
    await this.communityRepository.save(community);
  }
}
