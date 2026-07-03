import { PagingDTO } from '@/shared/dto/index.js';

export interface IUseCase<CreateDTO, UpdateDTO, Entity, Cond> {
    create(data: CreateDTO): Promise<string>;
    getDetail(id: string): Promise<Entity | null>;
    list(cond: Cond, paging: PagingDTO): Promise<Array<Entity>>;
    update(id: string, data: UpdateDTO): Promise<boolean>;
    delete(id: string): Promise<boolean>;
}
