import {  request,  summary,  body,  tags,  middlewares,  path,  description, query } from '../../../dist'
import dbClient from '../../middleware/db'
// .toUpperCase()
const tag = tags(['RouteName'.toLowerCase().replace('RouteName'.charAt(0),'RouteName'.charAt(0).toUpperCase())])

const bodyConditions = {
  // jsonStr 是一条数据记录json 字符串对象，用于对数据集合的增、删、改、查时，分别作为，插入数据、删除条件、修改条件、查询条件json字符串对象传入
  // JsonStr is a data record json string object, which is used to add, delete, change, and check the data set, respectively as, insert data, delete condition, modify condition, and query condition json string object passed in
  jsonStr : { type: 'object', description: 'json 字符串' }
}
const upDateJson = {
  condition: { type: 'object', require: 'true', description: 'Update the conditional json string'},
  json: {  type: 'object', require: 'true', description: 'Update the data json string'}
}
const queryConditions = {
  jsonStr : { type: 'string', description: 'a jsons data string or condition'},
  page: { type: 'number', description: 'The current page number "Not set to query all"' },
  pageSize: { type: 'number', description: 'Number of data bars per page "Not set to show all"' },
  filterFileds: { type: 'string', description: '字段过滤条件 除_id 外，其他不同字段不能同时设置显示和隐藏，只能二选一'}
}

const logTime = () => async (ctx, next) => {
  console.time('start')
  await next()
  console.timeEnd('start')
}
export default class RouteName{
  // 增
  @request('POST', '/RouteName/add')
  @summary('add RouteName')
  @description('add a RouteName')
  @tag
  @middlewares([logTime()])
  @body(bodyConditions)
  static async register(ctx, next) {
    let params = ctx.request.body
    let postData = {}
    let result = {}
    if(params.jsonStr !== undefined){
      try {
        postData = typeof params.jsonStr === 'string' ? JSON.parse(params.jsonStr) : params.jsonStr
        result = await dbClient.insert('RouteName',postData)
      } catch (e) {
        console.log(e);
        throw Error('Jsonstr is not a json string')
      }
      ctx.body = result
    }else{
      ctx.body = {
        code: 500,
        message: 'jsonStr undefined'
      }
      return
    }
  }
  // 删
  @request('DELETE', '/RouteName/delete')
  @summary('delete RouteName by condition')
  @tag
  @body(bodyConditions)
  // @path({ id: { type: 'string', required: true } })
  static async deleteMany(ctx) {
    let params = ctx.request.body
    let paramsData = {}
    if(params.jsonStr !== undefined){
      try {
        paramsData = typeof params.jsonStr === 'string' ? JSON.parse(params.jsonStr) : params.jsonStr
        if(paramsData['_id']){
          paramsData._id = dbClient.getObjectId(paramsData['_id'])
        }
        let result = await dbClient.remove('RouteName',paramsData)
        ctx.body = result

      } catch (e) {
        // console.log('Jsonstr is not a json string',e)
        throw Error('Jsonstr is not a json string')
        return
      }
    }else {
      ctx.body = {
        code: 500,
        message: 'Jsonstr is undefined'
      }
    }
  }
// 改
  @request('Put', '/RouteName/update')
  @summary('update RouteName')
  @description('update a RouteName')
  @tag
  @middlewares([logTime()])
  @body(upDateJson)
  static async updateData(ctx, next) {
    let params = ctx.request.body
    let condition = {}
    let postData = {}
    let result = {}
    // if(params.condition !== undefined && params.jsonStr !== undefined){
    //   try {
    //     condition = typeof params.condition === 'string' ? JSON.parse(params.condition) : params.condition
    //     postData = typeof params.jsonStr === 'string' ? JSON.parse(params.jsonStr) : params.jsonStr
    //     result = await dbClient.update('RouteName',condition,postData)
    //   } catch (e) {
    //     console.log(e);
    //     throw Error('Jsonstr is not a json string')
    //   }
    //   ctx.body = result
    // }
    if(params.json !== undefined && params.condition !== undefined){
       try{
         delete params.json['_id']
         condition._id = dbClient.getObjectId(params.condition._id)
         result = await dbClient.update('config',condition, params.json)
       }catch (e) {
        // console.log(e);
        throw Error('jsonStr is not a json string ')
      }
    }else{
      ctx.body = {
        code: 500,
        message: params.condition ? 'jsonStr undefined' : (params.json ? 'condition json string undefined' : ' condition and jsonStr json string all undefined or {}')
      }
      return
    }
  }
// 查
  @request('get', '/RouteName/find')
  @summary('RouteName list / query by condition')
  @query(queryConditions)
  @tag
  static async getAll(ctx) {
    let params = ctx.request.query
    let filterConditions = {}
    let paramsData = {}
    if(params['jsonStr'] && params['jsonStr'] !== undefined){
      try {
        paramsData = JSON.parse(params.jsonStr)
      } catch (e) {
        throw Error('Jsonstr is not a json string')
        return
      }
    }
    if(params['filterFileds']){
      filterConditions = JSON.parse(params.filterFileds)
    }
    if(paramsData['_id']){
      paramsData._id = dbClient.getObjectId(paramsData['_id'])
    }
    let result = params['page'] && params['pageSize'] ? await dbClient.find('RouteName', paramsData, filterConditions,  params.page, params.pageSize) : await dbClient.find('RouteName', paramsData, filterConditions)
    ctx.body = result
  }
}
