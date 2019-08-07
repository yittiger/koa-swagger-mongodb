import {
  request,
  summary,
  body,
  tags,
  middlewares,
  description,
  query
} from '../../../dist';
import dbClient from '../../middleware/db';
// .toUpperCase()
const tag = tags([
  'house'
    .toLowerCase()
    .replace('house'.charAt(0), 'house'.charAt(0).toUpperCase())
]);

const logTime = () => async (ctx, next) => {
  console.time('start');
  await next();
  console.timeEnd('start');
};

export default class house {
  // 增
  @request('POST', '/house/add')
  @summary('add house')
  @description('add a house')
  @tag
  @middlewares([logTime()])
  @body({})
  static async add(ctx) {
    const params = ctx.request.body;
    if (!Object.keys(params).length) {
      ctx.body = {
        code: 400,
        message: '缺少添加数据'
      };
      return;
    }
    const buildInfo = params.buildinfo;
    const builds = params.build;
    const getBuilds = await dbClient.find('builds', {
      _id: dbClient.getObjectId(buildInfo._id)
    });

    // console.log(builds, '/builds');

    const dbBuildsData = getBuilds.data[0];
    // 检查是否存在锁定房号
    const haslocked = builds.some((build) => {
      if (
        build.rindex !== undefined &&
        build.key !== undefined &&
        build.key !== '' &&
        build.index !== undefined
      ) {
        // 房号
        const dbRoom = dbBuildsData.builds[build.index].floor[build.key].room;
        return dbRoom.some((_room, _key) =>
          _key === build.rindex && _room.selected && build.name === _room.name);
      }
      if (
        build.rindex === undefined &&
        build.key !== undefined &&
        build.key !== ''
      ) {
        // 整层
        const dbFloor = dbBuildsData.builds[build.index].floor[build.key];
        // 返回楼层是否有被锁定的房号 true 有 false  无

        return dbFloor.room.some(room => room.selected && room.locked);
      }
      if (build.rindex === undefined && !build.key && build.key !== 0) {
        // 整栋
        const dbBuild = dbBuildsData.builds[build.index];
        return dbBuild.floor.some((_floor) => {
          // console.log(_floor.name, '_floor');

          if (_floor.selected && _floor.locked) {
            return _floor.selected && _floor.locked;
          }
          _floor.room.some(_room => _room.selected && _room.locked);
        });
      }
    });
    // console.log(haslocked, '/haslocked');

    if (!haslocked) {
      // false 没有被锁住的房号/楼层/楼栋
      // todo 加锁，更新数据
      const lockedBlooean = true;
      const updateHandler = async (updateData) => {
        await dbClient.update(
          'builds',
          {
            _id: dbClient.getObjectId(buildInfo._id)
          },
          updateData
        );
      };

      //  锁定选择的房源
      builds.forEach(async (build) => {
        if (
          build.rindex !== undefined &&
          build.key !== undefined &&
          build.key !== '' &&
          build.index !== undefined
        ) {
          // 房号
          const dbRoom =
            dbBuildsData.builds[build.index].floor[build.key].room[
              build.rindex
            ];
          // console.log(dbRoom, '/dbRoom');
          // const lockRoom = dbRoom.map((_room) => {
          //   _room.selected = lockedBlooean;
          //   _room.locked = lockedBlooean;
          //   return _room;
          // });
          dbRoom.selected = lockedBlooean;
          dbRoom.locked = lockedBlooean;
          const updateData = {};
          const _floorName =
            dbBuildsData.builds[build.index].floor[build.key].name;
          params.floor =
            parseInt(_floorName).toString !== 'NaN'
              ? parseInt(_floorName)
              : _floorName;

          updateData[
            `builds.${build.index}.floor.${build.key}.room.${build.rindex}`
          ] = dbRoom;
          updateHandler(updateData);
        }
        if (
          build.rindex === undefined &&
          build.key !== undefined &&
          build.key !== ''
        ) {
          // 整层
          const dbFloor = dbBuildsData.builds[build.index].floor[build.key];
          console.log(dbFloor, '/floor');
          const lockRoom = dbFloor.room.map((_room) => {
            _room.selected = lockedBlooean;
            _room.locked = lockedBlooean;
            return _room;
          });
          dbFloor.room = lockRoom;
          dbFloor.selected = lockedBlooean;
          dbFloor.locked = lockedBlooean;
          dbFloor.roominput = '';
          const updateData = {};
          params.tag = '整层';
          params.floor =
            parseInt(dbFloor.name).toString !== 'NaN'
              ? parseInt(dbFloor.name)
              : dbFloor.name;
          updateData[`builds.${build.index}.floor.${build.key}`] = dbFloor;
          updateHandler(updateData);
        }
        if (build.rindex === undefined && !build.key && build.key !== 0) {
          // 整栋
          const dbBuild = dbBuildsData.builds[build.index];

          const lockedFloor = dbBuild.floor.map((_floor) => {
            _floor.selected = lockedBlooean;
            _floor.locked = lockedBlooean;
            _floor.room.map((_room) => {
              _room.selected = lockedBlooean;
              _room.locked = lockedBlooean;
              return _room;
            });
            return _floor;
          });
          dbBuild.selected = lockedBlooean;
          dbBuild.locked = lockedBlooean;
          dbBuild.floor = lockedFloor;
          dbBuild.inputfloor = '';
          const updateData = {};
          params.tag = '整栋';
          const _floorName = dbBuild.floor[build.key].name;
          params.floor =
            parseInt(_floorName).toString !== 'NaN'
              ? parseInt(_floorName)
              : _floorName;
          updateData[`builds.${build.index}`] = dbBuild;
          updateHandler(updateData);
        }
      });

      const result = await dbClient.insert('house', params);
      ctx.body = {
        code: result.code,
        message: result.message
      };

      // if (result.result)

      // ctx.body = tip;
    } else {
      ctx.body = {
        code: 400,
        message: '已有部分房号被锁定，请重新选择房号信息'
      };
    }

    // console.log(buildInfo, builds);

    // const result = await dbClient.insert('house', params);
    // ctx.body = result;
  }
  // 改
  @request('Put', '/house/update')
  @summary('update house')
  @description('update a house')
  @tag
  @middlewares([logTime()])
  @body({})
  static async updateData(ctx) {
    const params = ctx.request.body;
    if (!Object.keys(params).length) {
      ctx.body = {
        code: 400,
        message: '缺少必要参数'
      };
    }
    const condition = {};
    const postData = {};
    let result = {};

    if (params.json !== undefined && params.condition !== undefined) {
      try {
        delete params.json._id;
        condition._id = dbClient.getObjectId(params.condition._id);
        result = await dbClient.update('config', condition, params.json);
      } catch (e) {
        // console.log(e);
        throw Error('jsonStr is not a json string ');
      }
    }
  }
  // 查
  @request('post', '/house/find')
  @summary('house list / query by condition')
  @body({})
  @tag
  static async getAll(ctx) {
    const params = ctx.request.body;
    const post_params = {};

    Object.keys(params).map((key) => {
      switch (key) {
        case 'price':
        case 'area':
        case 'station':
        case 'partment':
        case 'floor':
          const _values = params[key].split('-');
          post_params[key] = {
            $gte: parseInt(_values[0].replace('>', ''))
          };
          if (_values[1]) {
            post_params[key] = {
              $gte: parseInt(_values[0]),
              $lte: parseInt(_values[1])
            };
          }
          break;
        case 'pic':
        case 'key':
        case 'addPrice':
        case 'updown':
        case 'jumplayer':
          post_params[key] = {
            $in: params[key]
          };
          break;
        case 'region':
          if (!params[key][1]) {
            post_params[`buildinfo.${key}.0`] = params[key][0];
          } else {
            post_params[`buildinfo.${key}`] = params[key];
          }
          break;
        case 'page':
        case 'pageSize':
          break;
        case 'floorName':
          post_params.floor = params[key];
          break;
        case 'keyword':
          post_params['buildinfo.name'] = new RegExp(params[key]);
          break;
        default:
          post_params[key] = params[key];
      }
    });
    console.log(post_params, '//');

    const result =
      params.page && params.pageSize
        ? await dbClient.find(
          'house',
          post_params,
          {},
          params.page,
          params.pageSize
        )
        : await dbClient.find('house', post_params, {});

    if (result.code === 200 && result.data) {
      ctx.body = {
        code: result.code,
        count: result.count,
        data: result.data
          .map(item => ({
            _id: item._id,
            nature: item.nature,
            // build: item.build,
            type: item.type,
            area: item.area,
            price: item.price,
            station: item.station,
            partment: item.partment,
            decorate: item.decorate,
            aspect: item.aspect,
            addPrice: item.addPrice,
            jumplayer: item.jumplayer,
            status: item.status,
            undown: item.undown,
            imgs: item.imgs,
            keyImg: !!item.keyImg,
            buildinfo: item.buildinfo,
            tag: item.tag || '',
            time: item.time,
            key: item.key,
            pic: item.pic
          }))
          .reverse()
      };
    } else {
      ctx.body = result;
    }
  }
}