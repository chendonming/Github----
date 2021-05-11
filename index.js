const axios = require('axios');
const QueryString = require('qs');
const server = require('./server');
const hosts = require('hosts-group');
const dns = require('dns')

console.log('正在查询机房信息...')

Promise.all(server.map(s => {
  return axios({
    url: 'http://ping.chinaz.com/iframe.ashx',
    params: {
      t: 'ping'
    },
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    data: QueryString.stringify({
      guid: s,
      host: 'github.com',
      ishost: '0',
      isipv6: '0',
      encode: 'vLtCvLxV07f5qlRYHoLFBPaKNX8OZFnP',
      checktype: '0'
    })
  })
})).then(res => {
  const finalTime = res.map(v => v.data).reduce((acc, val) => {
    const data = eval(val)
    if (!data.state) return acc
    const time = data.result.responsetime
    const stime = Number(time.substring(0, time.length - 2))
    if (isNaN(stime)) return acc
    if (acc && acc.result && acc.result.responsetime) {
      const accdata = eval(acc)
      const acctime = accdata.result.responsetime
      const accstime = Number(acctime.substring(0, acctime.length - 2))
      if (stime >= accstime) {
        return accdata
      }
    } else {
      return data
    }
  })

  if (finalTime) {
    console.log('查询机房成功, 延迟最低的机房为: ', finalTime);
  } else {
    console.error('查询机房信息失败，可能是网络波动引起的，建议重试...')
    process.stdout.write("任意字符结束进程")
    process.stdin.on('data', () => {
      process.exit(0);
    })
    return
  }
  console.log('正在设置DNS...')
  dns.lookup('github.com', (err, result) => {
    hosts.remove('github.com', result)
    hosts.set('github.com', finalTime.result.ip)
    console.log('成功! 打开github.com进行检验')
    process.stdout.write("任意字符结束进程")
    process.stdin.on('data', () => {
      process.exit(0);
    })
  })
}).catch(e => {
  console.error('查询失败, 信息为: ', e)
})
