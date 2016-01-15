import * as Serializer from 'jsonapi-serializer';

export interface IPagParams {
  offset: number;
  limit: number;
  total?: number;
}

export interface IQueryObj {
  [key: string]: string;
}

export interface IAdapterOptions {
  includeRelations?: boolean;
  query?: IQueryObj;
  pagination?: IPagParams;
}

export interface IAdapter {
  (
    data: any,
    type: string,
    baseUrl: string,
    serializerOptions: Serializer.ISerializerOptions,
    adapterOptions: IAdapterOptions
  ): Serializer;
}
