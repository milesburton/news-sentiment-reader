import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      ignore: 'pid,hostname',
      translateTime: 'HH:MM:ss',
      messageFormat: '{msg}',
      levelFirst: true,
      customColors: 'error:red,warn:yellow,info:blue,debug:gray',
      customLevels: {
        error: 50,
        warn: 40,
        info: 30,
        debug: 20
      }
    },
  },
  // Default serializers for cleaner error logging
  serializers: {
    error: pino.stdSerializers.err,
    // Custom serializer for news items to prevent huge content dumps
    newsItem: (item: any) => ({
      title: item.title,
      link: item.link,
      hasContent: !!item.content
    })
  }
});