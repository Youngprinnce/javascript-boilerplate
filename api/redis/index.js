const {promisify} = require("util");
const {createClient} = require('redis');
const {NODE_ENV, REDISCLOUD_URL, REDIS_URL} = process.env;

const REDIS_URL_CONFIG = NODE_ENV === 'development' ? {port: 6379, host: '127.0.0.1'} : REDIS_URL || REDISCLOUD_URL;
const client = createClient(REDIS_URL_CONFIG);

client.on('error', err => {
  console.log({err});

  // Terminate process on error
  process.exit(1);
});
client.on('end', () => console.log('Client disconnected from redis!'));
client.connect().then(console.log('Client connected to redis and ready!'));

/**
 * @description Delete matching keys from the redis store
 * @param {String} pattern - pattern of matching keys to delete from redis store
 * @returns null
 */
const scanAndDelete = async ({pattern}) => {
  let cursor = '0';
  do {
    const reply = await promisify(client.scan).bind(client)(cursor, 'MATCH', pattern, 'COUNT', '1000');
    cursor = reply[0];

    await promisify(client.del).bind(client)(reply[1]);
  } while (cursor !== '0');
}

/**
 * @description Get value stored inside of redis store
 * @param {String} key - key of the value to get from redis store
 * @returns {Promise<value>}
 */
const getRedisAsync = async ({key}) => await promisify(client.get).bind(client)(key);

/**
 * @description redisAIncr Redis Atomic Increment, increments a numeric value by 1
 * @param {String} key - key of the numerical value to increment from redis store
 * @returns {Promise<value>}
 */
const redisAIncr = async ({key}) => await promisify(client.incr).bind(client)(key);

/**
 * @description redisExpire set time for a Redis key to expire
 * @param {String} key - key of the value to set its expiry
 * @param {Number} expire - expiry of the key in seconds
 * @returns {Promise<value>}
 */
const redisExpire = async ({key, expire}) => await promisify(client.expire).bind(client)(key, expire);

/**
 * @description redisTTL get redis time to live (TTL) of a key
 * @param {String} key - key of the value to get its TTL
 * @returns {Promise<value>}
 */
const redisTTL = async ({key}) => await promisify(client.ttl).bind(client)(key);

/**
 * @description Set value stored inside of redis store, if expiry is not set, key will be persisted for life
 * @param {String} key - key of the value to save on redis store
 * @param {String} value - value to be saved on redis store
 * @param {Number || String} expiry - expiration in seconds
 * @returns {Promise<value>}
 */
const setRedisAsync = async ({key, value, expiry = null}) => {
  if (!expiry) return promisify(client.set).bind(client)(key, value);
  const existingKeyTTL = await redisTTL({key});
  return existingKeyTTL <= 0 ? await promisify(client.set).bind(client)(key, value, 'EX', expiry) :
    await promisify(client.set).bind(client)(key, value, 'EX', existingKeyTTL);
};

/**
 * @description Delete a pair of key and value stored inside of redis store
 * @param {String} key - key of the value to delete from redis store
 * @returns {Promise<value>}
 */
const deleteRedisAsync = async ({key}) => await promisify(client.del).bind(client)(key);

module.exports = {redisTTL, redisAIncr, redisExpire, deleteRedisAsync, getRedisAsync, setRedisAsync, scanAndDelete}
