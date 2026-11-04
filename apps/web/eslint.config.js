import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import { defineConfig } from 'eslint/config';
import rootConfig from '../../eslint.config.js';

export default defineConfig([...rootConfig, ...nextVitals, ...nextTs]);
