// fluid-reveal — a cursor's fluid wake paints a photo back through whatever covers it; one canvas moves between hosts

const SIM = 128;
const SPLAT_FORCE = 5000;
const CURL = 28;
const VEL_DISS = 0.992;
const DYE_DISS_IDLE = 0.55;
const PRESSURE_ITS = 20;
const IDLE_FRAMES = 40;

const VS = `attribute vec2 a_pos; varying vec2 v_uv;
  void main(){ v_uv=a_pos*.5+.5; gl_Position=vec4(a_pos,0.,1.); }`;

const SPLAT_FS = `precision highp float;
  uniform sampler2D u_src; uniform vec2 u_point, u_aspect; uniform vec3 u_color; uniform float u_radius;
  varying vec2 v_uv;
  void main(){
    vec2 p = (v_uv - u_point) * u_aspect;
    gl_FragColor = vec4(texture2D(u_src, v_uv).rgb + u_color * exp(-dot(p,p) / u_radius), 1.);
  }`;

const ADVECT_FS = `precision highp float;
  uniform sampler2D u_velocity, u_quantity; uniform vec2 u_texel; uniform float u_dt, u_dissipation;
  varying vec2 v_uv;
  void main(){
    vec2 coord = v_uv - u_dt * texture2D(u_velocity, v_uv).xy * u_texel;
    gl_FragColor = u_dissipation * texture2D(u_quantity, coord);
  }`;

const CURL_FS = `precision highp float;
  uniform sampler2D u_velocity; uniform vec2 u_texel; varying vec2 v_uv;
  void main(){
    float L = texture2D(u_velocity, v_uv - vec2(u_texel.x,0.)).y;
    float R = texture2D(u_velocity, v_uv + vec2(u_texel.x,0.)).y;
    float T = texture2D(u_velocity, v_uv + vec2(0.,u_texel.y)).x;
    float B = texture2D(u_velocity, v_uv - vec2(0.,u_texel.y)).x;
    gl_FragColor = vec4(0.5*(R-L-(T-B)), 0., 0., 1.);
  }`;

const VORTICITY_FS = `precision highp float;
  uniform sampler2D u_velocity, u_curl; uniform vec2 u_texel; uniform float u_curl_strength, u_dt;
  varying vec2 v_uv;
  void main(){
    float L = texture2D(u_curl, v_uv - vec2(u_texel.x,0.)).x;
    float R = texture2D(u_curl, v_uv + vec2(u_texel.x,0.)).x;
    float T = texture2D(u_curl, v_uv + vec2(0.,u_texel.y)).x;
    float B = texture2D(u_curl, v_uv - vec2(0.,u_texel.y)).x;
    float C = texture2D(u_curl, v_uv).x;
    vec2 force = normalize(vec2(abs(T)-abs(B), abs(R)-abs(L)) + 0.0001) * u_curl_strength * C;
    gl_FragColor = vec4(texture2D(u_velocity, v_uv).xy + force * u_dt, 0., 1.);
  }`;

const DIVERGENCE_FS = `precision highp float;
  uniform sampler2D u_velocity; uniform vec2 u_texel; varying vec2 v_uv;
  void main(){
    float L = texture2D(u_velocity, v_uv - vec2(u_texel.x,0.)).x;
    float R = texture2D(u_velocity, v_uv + vec2(u_texel.x,0.)).x;
    float T = texture2D(u_velocity, v_uv + vec2(0.,u_texel.y)).y;
    float B = texture2D(u_velocity, v_uv - vec2(0.,u_texel.y)).y;
    gl_FragColor = vec4(0.5*(R-L+T-B), 0., 0., 1.);
  }`;

const PRESSURE_FS = `precision highp float;
  uniform sampler2D u_pressure, u_divergence; uniform vec2 u_texel; varying vec2 v_uv;
  void main(){
    float L = texture2D(u_pressure, v_uv - vec2(u_texel.x,0.)).x;
    float R = texture2D(u_pressure, v_uv + vec2(u_texel.x,0.)).x;
    float T = texture2D(u_pressure, v_uv + vec2(0.,u_texel.y)).x;
    float B = texture2D(u_pressure, v_uv - vec2(0.,u_texel.y)).x;
    gl_FragColor = vec4((L+R+T+B-texture2D(u_divergence, v_uv).x)*0.25, 0., 0., 1.);
  }`;

const GRADIENT_FS = `precision highp float;
  uniform sampler2D u_pressure, u_velocity; uniform vec2 u_texel; varying vec2 v_uv;
  void main(){
    float pL = texture2D(u_pressure, v_uv - vec2(u_texel.x,0.)).x;
    float pR = texture2D(u_pressure, v_uv + vec2(u_texel.x,0.)).x;
    float pT = texture2D(u_pressure, v_uv + vec2(0.,u_texel.y)).x;
    float pB = texture2D(u_pressure, v_uv - vec2(0.,u_texel.y)).x;
    gl_FragColor = vec4(texture2D(u_velocity, v_uv).xy - 0.5*vec2(pR-pL, pT-pB), 0., 1.);
  }`;

// Inside the wake the quote takes white or its own dark ink, whichever the photo behind it is not, over a soft halo
// u_flood grows a wobbling pool of photo out from u_origin, its edge pushed about by the wake
const RENDER_FS = `precision highp float;
  uniform sampler2D u_dye, u_photo, u_text; uniform vec2 u_scale, u_offset, u_halo, u_origin, u_ratio;
  uniform vec3 u_ink; uniform float u_shift, u_textAlpha, u_flood, u_time; varying vec2 v_uv;
  void main(){
    float dye = clamp(texture2D(u_dye, v_uv).r, 0., 1.);
    vec3 photo = texture2D(u_photo, v_uv * u_scale + u_offset).rgb;
    vec2 t = v_uv + vec2(0., u_shift);
    float text = texture2D(u_text, t).a * u_textAlpha;
    float halo = 0.;
    float lum = 0.;
    for (int i = 0; i < 8; i++) {
      vec2 d = vec2(cos(float(i) * 0.785398), sin(float(i) * 0.785398));
      halo += texture2D(u_text, t + d * u_halo).a + texture2D(u_text, t + d * u_halo * 2.).a;
      lum += dot(texture2D(u_photo, (v_uv + d * u_halo * 6.) * u_scale + u_offset).rgb, vec3(0.299, 0.587, 0.114));
    }
    halo = clamp(halo / 8., 0., 1.) * u_textAlpha;
    float light = smoothstep(0.5, 0.7, lum / 8.);
    vec3 ink = mix(vec3(1.), u_ink, light);
    vec3 color = mix(mix(photo, vec3(light), 0.45 * halo), ink, text);
    vec2 p = (v_uv - u_origin) * u_ratio;
    float ang = atan(p.y, p.x);
    float d = length(p) + 0.035 * sin(ang * 5. + u_time * 1.4) + 0.025 * sin(ang * 9. - u_time * 2.1) - 0.25 * dye;
    float flood = (1. - smoothstep(u_flood - 0.12, u_flood, d)) * step(0.001, u_flood);
    gl_FragColor = vec4(color, max(smoothstep(0.018, 0.22, dye), flood));
  }`;

// radius: splat size; dissipation: how long the wake lingers; flood: colour pours out from the entry point
function createFluid({ radius, dissipation, flood: floods = false }) {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false, antialias: false, powerPreference: "low-power" });
  if (!gl || !gl.getExtension("OES_texture_float")) return null;
  gl.getExtension("OES_texture_float_linear");

  const shader = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };
  const program = (fs) => {
    const p = gl.createProgram();
    gl.attachShader(p, shader(gl.VERTEX_SHADER, VS));
    gl.attachShader(p, shader(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    return gl.getProgramParameter(p, gl.LINK_STATUS) ? p : null;
  };
  const texture = () => {
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  };
  const target = () => {
    const tex = texture();
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, SIM, SIM, 0, gl.RGBA, gl.FLOAT, null);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    return { tex, fbo };
  };

  const progs = {
    splat: program(SPLAT_FS), advect: program(ADVECT_FS), curl: program(CURL_FS), vort: program(VORTICITY_FS),
    div: program(DIVERGENCE_FS), pressure: program(PRESSURE_FS), grad: program(GRADIENT_FS), render: program(RENDER_FS),
  };
  if (Object.values(progs).some((p) => !p)) return null;

  let vel = [target(), target()];
  let pre = [target(), target()];
  let dye = [target(), target()];
  const divT = target();
  const curlT = target();
  // Some drivers expose float textures but cannot render into them
  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) return null;
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, -1, 1, 1, -1, 1]), gl.STATIC_DRAW);

  const uniforms = new Map();
  const loc = (p, n) => {
    if (!uniforms.has(p)) uniforms.set(p, {});
    const cache = uniforms.get(p);
    return n in cache ? cache[n] : (cache[n] = gl.getUniformLocation(p, n));
  };
  const bindTex = (unit, t) => { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t); };
  const pass = (out, p, set) => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, out ? out.fbo : null);
    gl.viewport(0, 0, out ? SIM : canvas.width, out ? SIM : canvas.height);
    gl.useProgram(p);
    const a = gl.getAttribLocation(p, "a_pos");
    gl.enableVertexAttribArray(a);
    gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
    set(p);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  };
  const clear = (t) => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
  };

  const photos = new WeakMap();
  const textTex = texture();
  const textCanvas = document.createElement("canvas");
  let quote = null;
  let ink = [0, 0, 0];
  let photo = null;
  let fit = [1, 1, 0, 0];
  let mx = 0.5, my = 0.5, dmx = 0, dmy = 0;
  let pointer = false;
  let origin = [0.5, 0.5];
  let flood = 0;
  let idle = 0;
  let raf = 0;
  let last = 0;

  const splat = (field, color) => {
    pass(field[1], progs.splat, (p) => {
      bindTex(0, field[0].tex);
      gl.uniform1i(loc(p, "u_src"), 0);
      gl.uniform2f(loc(p, "u_point"), mx, my);
      gl.uniform2f(loc(p, "u_aspect"), canvas.width / canvas.height, 1);
      gl.uniform3f(loc(p, "u_color"), ...color);
      gl.uniform1f(loc(p, "u_radius"), radius);
    });
    field.reverse();
  };

  const frame = (t) => {
    const dt = Math.min((t - last) * 0.001 || 0.016, 0.016);
    last = t;
    const moved = pointer && Math.abs(dmx) + Math.abs(dmy) > 0.0001;
    if (moved) {
      splat(vel, [dmx * SPLAT_FORCE, dmy * SPLAT_FORCE, 0]);
      splat(dye, [1, 1, 1]);
      idle = 0;
    } else idle++;
    dmx = dmy = 0;

    const texel = (p) => gl.uniform2f(loc(p, "u_texel"), 1 / SIM, 1 / SIM);
    pass(curlT, progs.curl, (p) => { bindTex(0, vel[0].tex); gl.uniform1i(loc(p, "u_velocity"), 0); texel(p); });
    pass(vel[1], progs.vort, (p) => {
      bindTex(0, vel[0].tex); gl.uniform1i(loc(p, "u_velocity"), 0);
      bindTex(1, curlT.tex); gl.uniform1i(loc(p, "u_curl"), 1);
      texel(p); gl.uniform1f(loc(p, "u_curl_strength"), CURL); gl.uniform1f(loc(p, "u_dt"), dt);
    });
    vel.reverse();
    pass(divT, progs.div, (p) => { bindTex(0, vel[0].tex); gl.uniform1i(loc(p, "u_velocity"), 0); texel(p); });
    clear(pre[0]);
    for (let i = 0; i < PRESSURE_ITS; i++) {
      pass(pre[1], progs.pressure, (p) => {
        bindTex(0, pre[0].tex); gl.uniform1i(loc(p, "u_pressure"), 0);
        bindTex(1, divT.tex); gl.uniform1i(loc(p, "u_divergence"), 1);
        texel(p);
      });
      pre.reverse();
    }
    pass(vel[1], progs.grad, (p) => {
      bindTex(0, pre[0].tex); gl.uniform1i(loc(p, "u_pressure"), 0);
      bindTex(1, vel[0].tex); gl.uniform1i(loc(p, "u_velocity"), 1);
      texel(p);
    });
    vel.reverse();
    const advect = (field, dissipation) => {
      pass(field[1], progs.advect, (p) => {
        bindTex(0, vel[0].tex); gl.uniform1i(loc(p, "u_velocity"), 0);
        bindTex(1, field[0].tex); gl.uniform1i(loc(p, "u_quantity"), 1);
        texel(p); gl.uniform1f(loc(p, "u_dt"), dt); gl.uniform1f(loc(p, "u_dissipation"), dissipation);
      });
      field.reverse();
    };
    advect(vel, VEL_DISS);
    advect(dye, pointer ? dissipation : DYE_DISS_IDLE);
    if (floods) flood += ((pointer ? 1.7 : 0) - flood) * (1 - Math.exp(-dt * (pointer ? 2.2 : 3.5)));

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (photo) {
      pass(null, progs.render, (p) => {
        bindTex(0, dye[0].tex); gl.uniform1i(loc(p, "u_dye"), 0);
        bindTex(1, photo); gl.uniform1i(loc(p, "u_photo"), 1);
        gl.uniform2f(loc(p, "u_scale"), fit[0], fit[1]);
        gl.uniform2f(loc(p, "u_offset"), fit[2], fit[3]);
        bindTex(2, textTex); gl.uniform1i(loc(p, "u_text"), 2);
        gl.uniform2f(loc(p, "u_halo"), 1.5 / canvas.clientWidth, 1.5 / canvas.clientHeight);
        // the quote may still be rising into place: follow its live offset and fade
        const card = canvas.parentElement.getBoundingClientRect();
        const shift = quote ? quote.getBoundingClientRect().top - card.top - quote.offsetTop : 0;
        gl.uniform1f(loc(p, "u_shift"), shift / card.height);
        gl.uniform1f(loc(p, "u_textAlpha"), quote ? parseFloat(getComputedStyle(quote).opacity) : 0);
        gl.uniform3f(loc(p, "u_ink"), ...ink);
        gl.uniform2f(loc(p, "u_origin"), ...origin);
        gl.uniform2f(loc(p, "u_ratio"), canvas.width / canvas.height, 1);
        gl.uniform1f(loc(p, "u_flood"), flood);
        gl.uniform1f(loc(p, "u_time"), t * 0.001);
      });
    }

    raf = !pointer && idle > IDLE_FRAMES && flood < 0.005 ? 0 : requestAnimationFrame(frame);
  };
  const wake = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };

  const photoFor = (img) => {
    if (photos.has(img)) return photos.get(img);
    const t = texture();
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    try {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    } catch {
      return null; // a cross-origin photo cannot be read into WebGL
    }
    const entry = { tex: t, ratio: img.naturalWidth / img.naturalHeight };
    photos.set(img, entry);
    return entry;
  };

  // The quote's words drawn where they sit at rest, as a mask for the white copy
  const drawText = (dpr) => {
    textCanvas.width = canvas.width;
    textCanvas.height = canvas.height;
    const ctx = textCanvas.getContext("2d");
    ctx.clearRect(0, 0, textCanvas.width, textCanvas.height);
    if (quote) {
      const cs = getComputedStyle(quote);
      ink = (cs.color.match(/[\d.]+/g) || [0, 0, 0]).slice(0, 3).map((v) => v / 255);
      ctx.scale(dpr, dpr);
      ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      if ("letterSpacing" in ctx && cs.letterSpacing !== "normal") ctx.letterSpacing = cs.letterSpacing;
      ctx.fillStyle = "#fff";
      const ascent = ctx.measureText("Hg").fontBoundingBoxAscent;
      const at = quote.getBoundingClientRect();
      const walker = document.createTreeWalker(quote, NodeFilter.SHOW_TEXT);
      const range = document.createRange();
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        for (const match of node.data.matchAll(/\S+/g)) {
          range.setStart(node, match.index);
          range.setEnd(node, match.index + match[0].length);
          const r = range.getClientRects()[0];
          if (r) ctx.fillText(match[0], r.left - at.left + quote.offsetLeft, r.top - at.top + quote.offsetTop + ascent);
        }
      }
    }
    bindTex(2, textTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textCanvas);
  };

  return {
    canvas,
    // text: an element whose words recolour over the photo; place: where the canvas goes in the host
    attach(host, { className, text = null, place = (img) => img.after(canvas) }) {
      const img = host.querySelector("img");
      if (!img || !img.complete || !img.naturalWidth) return false;
      const entry = photoFor(img);
      if (!entry) return false;
      const box = { width: img.offsetWidth, height: img.offsetHeight };
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(box.width * dpr));
      canvas.height = Math.max(1, Math.round(box.height * dpr));
      const ratio = box.width / box.height;
      const sx = entry.ratio > ratio ? ratio / entry.ratio : 1;
      const sy = entry.ratio > ratio ? 1 : entry.ratio / ratio;
      fit = [sx, sy, (1 - sx) / 2, (1 - sy) / 2];
      photo = entry.tex;
      quote = text;
      drawText(dpr);
      [...vel, ...pre, ...dye].forEach(clear);
      flood = 0;
      canvas.className = className;
      place(img, canvas);
      return true;
    },
    move(event) {
      const r = canvas.getBoundingClientRect();
      const nx = (event.clientX - r.left) / r.width;
      const ny = 1 - (event.clientY - r.top) / r.height;
      if (pointer) { dmx += nx - mx; dmy += ny - my; } else origin = [nx, ny];
      mx = nx; my = ny;
      pointer = true;
      wake();
    },
    leave() { pointer = false; dmx = dmy = 0; },
  };
}

const canHover = () =>
  window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// One fluid per page, created on the first hover (or up front when the resting look depends on it)
function bindHosts(hosts, fluid, options) {
  hosts.forEach((host) => {
    host.addEventListener("pointerenter", (event) => {
      if (event.pointerType !== "mouse") return;
      const f = fluid();
      if (!f || !f.attach(host, options(host))) return;
      f.move(event);
    });
    host.addEventListener("pointermove", (event) => {
      const f = fluid();
      if (event.pointerType === "mouse" && f && host.contains(f.canvas)) f.move(event);
    });
    host.addEventListener("pointerleave", () => fluid()?.leave());
  });
}

export function initQuoteReveal(root = document) {
  const hosts = root.querySelectorAll("[data-quote-cards] [data-quote-card]");
  if (!hosts.length || !canHover()) return;
  let fluid;
  const get = () => (fluid === undefined ? (fluid = createFluid({ radius: 0.0045, dissipation: 0.965 })) : fluid);
  bindHosts(hosts, get, (card) => ({
    className: "testimonials__fluid",
    text: card.querySelector("blockquote"),
    place: (img, canvas) => card.append(canvas),
  }));
}

// Portraits rest in the brand two-tone (CSS, switched on only once WebGL is running) and flood into colour on hover
export function initPortraitReveal(root = document) {
  const hosts = root.querySelectorAll("[data-portrait-reveal]");
  if (!hosts.length || !canHover()) return;
  const fluid = createFluid({ radius: 0.006, dissipation: 0.975, flood: true });
  if (!fluid) return;
  document.documentElement.classList.add("has-portrait-reveal");
  bindHosts(hosts, () => fluid, (host) => ({ className: host.dataset.portraitReveal }));
}
