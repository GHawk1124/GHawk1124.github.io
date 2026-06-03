/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare module '@cv' {
  import type { CV } from './cv';
  const cv: CV;
  export default cv;
  export const basics: CV['basics'];
  export const work: CV['work'];
  export const education: CV['education'];
  export const skills: CV['skills'];
  export const projects: CV['projects'];
  export const certificates: CV['certificates'];
  export const images: CV['images'];
}