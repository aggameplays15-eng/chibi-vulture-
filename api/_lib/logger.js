const db = require('./db');

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

const CURRENT_LOG_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL || 'INFO'] || LOG_LEVELS.INFO;

const formatTimestamp = () => {
  return new Date().toISOString();
};

const formatLogEntry = (level, message, meta = {}) => {
  return {
    timestamp: formatTimestamp(),
    level,
    message,
    ...meta,
    environment: process.env.NODE_ENV || 'development'
  };
};

const consoleLog = (level, message, meta = {}) => {
  const entry = formatLogEntry(level, message, meta);
  const colorize = {
    DEBUG: '\x1b[36m', // Cyan
    INFO: '\x1b[32m',  // Green
    WARN: '\x1b[33m',  // Yellow
    ERROR: '\x1b[31m', // Red
    RESET: '\x1b[0m'
  };

  const prefix = `${colorize[level]}[${entry.timestamp}] ${level}${colorize.RESET}`;
  
  if (level === 'ERROR') {
    console.error(prefix, message, meta.error || '');
  } else if (level === 'WARN') {
    console.warn(prefix, message, JSON.stringify(meta, null, 2));
  } else {
    console.log(prefix, message, JSON.stringify(meta, null, 2));
  }
};

const shouldLog = (level) => {
  return LOG_LEVELS[level] >= CURRENT_LOG_LEVEL;
};

const logger = {
  debug: (message, meta = {}) => {
    if (shouldLog('DEBUG')) {
      consoleLog('DEBUG', message, meta);
    }
  },

  info: (message, meta = {}) => {
    if (shouldLog('INFO')) {
      consoleLog('INFO', message, meta);
    }
  },

  warn: (message, meta = {}) => {
    if (shouldLog('WARN')) {
      consoleLog('WARN', message, meta);
    }
  },

  error: (message, error, meta = {}) => {
    if (shouldLog('ERROR')) {
      consoleLog('ERROR', message, { ...meta, error: error?.message || error, stack: error?.stack });
    }
  },

  // Audit log to database
  audit: async (action, actor_handle, details = {}, req = {}) => {
    const ip = req.headers ? req.headers['x-forwarded-for'] || req.socket.remoteAddress : 'unknown';
    const userAgent = req.headers ? req.headers['user-agent'] : 'unknown';
    
    try {
      await db.query(
        'INSERT INTO audit_logs (action, actor_handle, details, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5)',
        [action, actor_handle, JSON.stringify(details), ip, userAgent]
      );
      logger.info('Audit log recorded', { action, actor_handle });
    } catch (err) {
      logger.error('Failed to write audit log', err, { action, actor_handle });
    }
  },

  // Request logging middleware
  requestLogger: (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.info('HTTP Request', {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
        userAgent: req.headers['user-agent']
      });
    });
    
    if (next) next();
  }
};

module.exports = logger;
