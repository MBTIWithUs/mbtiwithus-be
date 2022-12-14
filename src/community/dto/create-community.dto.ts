import { IsNotEmpty, Length } from "class-validator";

export class CreateCommunityDto {

    // comments: Comment[];

    // id: number;
    // creatorId: number;
    @IsNotEmpty()
    isAnonymous: boolean;

    @IsNotEmpty()
    @Length(1, 64)
    title: string;
    @IsNotEmpty()
    @Length(1, 1024)
    content: string;
    @IsNotEmpty()
    @Length(4, 16)
    tag: string;

    // views: number;
    // likes: number;
    // hates: number;

    // createdAt: string;
    // updatedAt: string;
    // deletedAt: string;
}
