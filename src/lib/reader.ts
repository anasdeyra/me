import { createReader } from '@keystatic/core/reader';
import keystaticConfig from '../../keystatic.config';

// Build-time content reader (official Keystatic approach, no runtime CMS in prod).
export const reader = createReader(process.cwd(), keystaticConfig);
