'use strict';

import * as Serializer from 'jsonapi-serializer';

export interface IPagParams {
  offset: number;
  limit: number;
  total?: number;
}

export interface QueryObj {
  [key: string]: string;
}

export interface IAdapterOptions {
  query?: QueryObj;
  pagination?: IPagParams;
}

export interface Adapter {
  (
    data: any,
    type: string,
    baseUrl: string,
    serializerOptions: Serializer.ISerializerOptions,
    adapterOptions: IAdapterOptions
  ): Serializer;
}
