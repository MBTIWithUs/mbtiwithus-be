import { DataSource, ViewColumn, ViewEntity } from "typeorm";
import { Community } from "./community.entity";

@ViewEntity({
    expression: (dataSource: DataSource) => dataSource
        .createQueryBuilder()
        .select("community.id", "id")
        .addSelect("community.creatorId", "creatorId")
        .addSelect("community.isAnonymous", "isAnonymous")
        .addSelect("community.title", "title")
        .addSelect("community.views", "views")
        .addSelect("community.createdAt", "createdAt")
        .addSelect("community.updatedAt", "updatedAt")
        .addSelect("community.deletedAt", "deletedAt")
        .from(Community, "community")
})
export class CommunitySummary {

    @ViewColumn()
    id: number;
    @ViewColumn()
    creatorId: number;
    @ViewColumn()
    isAnonymous: boolean;

    @ViewColumn()
    title: string;

    @ViewColumn()
    views: number;

    @ViewColumn()
    createdAt: string;
    @ViewColumn()
    updatedAt: string;
    @ViewColumn()
    deletedAt: string;
}