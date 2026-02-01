import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { JobSite } from "./entities";
import { CreateJobSiteDto, UpdateJobSiteDto } from "./dto/sites.dto";

@Injectable()
export class SitesService {
  constructor(
    @InjectRepository(JobSite)
    private readonly jobSiteRepo: Repository<JobSite>,
  ) {}

  async findAll(projectId?: string): Promise<JobSite[]> {
    const where: any = { isActive: true };
    if (projectId) {
      where.projectId = projectId;
    }
    return this.jobSiteRepo.find({
      where,
      relations: ["project"],
      order: { name: "ASC" },
    });
  }

  async findById(id: string): Promise<JobSite> {
    const site = await this.jobSiteRepo.findOne({
      where: { id },
      relations: ["project"],
    });
    if (!site) {
      throw new NotFoundException(`JobSite ${id} not found`);
    }
    return site;
  }

  async create(dto: CreateJobSiteDto, userId?: string): Promise<JobSite> {
    const site = this.jobSiteRepo.create({
      ...dto,
      createdBy: userId,
    });
    return this.jobSiteRepo.save(site);
  }

  async update(id: string, dto: UpdateJobSiteDto): Promise<JobSite> {
    const site = await this.findById(id);
    Object.assign(site, dto);
    return this.jobSiteRepo.save(site);
  }

  async findNearby(
    lat: number,
    lng: number,
    radiusKm: number = 10,
  ): Promise<JobSite[]> {
    // Simple bounding box query for nearby sites
    const latDelta = radiusKm / 111; // ~111km per degree latitude
    const lngDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));

    return this.jobSiteRepo
      .createQueryBuilder("site")
      .where("site.latitude BETWEEN :minLat AND :maxLat", {
        minLat: lat - latDelta,
        maxLat: lat + latDelta,
      })
      .andWhere("site.longitude BETWEEN :minLng AND :maxLng", {
        minLng: lng - lngDelta,
        maxLng: lng + lngDelta,
      })
      .andWhere("site.isActive = true")
      .getMany();
  }
}
