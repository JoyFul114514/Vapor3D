// Name: Vapor3D
// ID: vapor3D
// Description: 3D Engine for Turbowarp
// By: Joy_Ful <https://github.com/JoyFul114514>
// License: MPL-2.0 AND BSD-3-Clause
// Version: 1.0.0

(function (Scratch) {
  "use strict";

  if (!Scratch.extensions.unsandboxed) throw new Error("Vapor 3D must run unsandboxed");

  const vm = Scratch.vm;
  const renderer = vm.renderer;
  const runtime = vm.runtime;

  // ==========================================
  // 独立 WebGL2 上下文
  // ==========================================
  const canvas3d = document.createElement('canvas');
  const gl3d = canvas3d.getContext('webgl2', {
    alpha: true,
    depth: true,
    stencil: true,
    antialias: true,
    preserveDrawingBuffer: true,
    powerPreference: 'high-performance'
  });

  const debugInfo = gl3d.getExtension('WEBGL_debug_renderer_info');
  if (debugInfo) {
    const vendor = gl3d.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
    const renderer = gl3d.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    console.log(vendor);
    console.log(renderer);
  }

  const m4 = {
    identity: () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    perspective: (fovy, aspect, near, far) => {
      const f = Math.tan(Math.PI * 0.5 - 0.5 * fovy);
      const rangeInv = 1.0 / (near - far);
      return [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (near + far) * rangeInv, -1, 0, 0, near * far * rangeInv * 2, 0];
    },
    translate: (m, tx, ty, tz) => [
      m[0], m[1], m[2], m[3],
      m[4], m[5], m[6], m[7],
      m[8], m[9], m[10], m[11],
      (tx || 0) * m[0] + (ty || 0) * m[4] + (tz || 0) * m[8] + m[12],
      (tx || 0) * m[1] + (ty || 0) * m[5] + (tz || 0) * m[9] + m[13],
      (tx || 0) * m[2] + (ty || 0) * m[6] + (tz || 0) * m[10] + m[14],
      (tx || 0) * m[3] + (ty || 0) * m[7] + (tz || 0) * m[11] + m[15]
    ],
    scale: (m, sx, sy, sz) => [
      (sx || 1) * m[0], (sx || 1) * m[1], (sx || 1) * m[2], (sx || 1) * m[3],
      (sy || 1) * m[4], (sy || 1) * m[5], (sy || 1) * m[6], (sy || 1) * m[7],
      (sz || 1) * m[8], (sz || 1) * m[9], (sz || 1) * m[10], (sz || 1) * m[11],
      m[12], m[13], m[14], m[15]
    ],
    xRotate: (m, rad) => {
      const c = Math.cos(rad), s = Math.sin(rad);
      return [m[0], m[1], m[2], m[3], c * m[4] + s * m[8], c * m[5] + s * m[9], c * m[6] + s * m[10], c * m[7] + s * m[11], c * m[8] - s * m[4], c * m[9] - s * m[5], c * m[10] - s * m[6], c * m[11] - s * m[7], m[12], m[13], m[14], m[15]];
    },
    yRotate: (m, rad) => {
      const c = Math.cos(rad), s = Math.sin(rad);
      return [c * m[0] - s * m[8], c * m[1] - s * m[9], c * m[2] - s * m[10], c * m[3] - s * m[11], m[4], m[5], m[6], m[7], s * m[0] + c * m[8], s * m[1] + c * m[9], s * m[2] + c * m[10], s * m[3] + c * m[11], m[12], m[13], m[14], m[15]];
    },
    zRotate: (m, rad) => {
      const c = Math.cos(rad), s = Math.sin(rad);
      return [c * m[0] + s * m[4], c * m[1] + s * m[5], c * m[2] + s * m[6], c * m[3] + s * m[7], c * m[4] - s * m[0], c * m[5] - s * m[1], c * m[6] - s * m[2], c * m[7] - s * m[3], m[8], m[9], m[10], m[11], m[12], m[13], m[14], m[15]];
    },
    multiply: (a, b) => {
      const out = new Array(16);
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          out[i * 4 + j] = a[i * 4 + 0] * b[0 * 4 + j] + a[i * 4 + 1] * b[1 * 4 + j] + a[i * 4 + 2] * b[2 * 4 + j] + a[i * 4 + 3] * b[3 * 4 + j];
        }
      }
      return out;
    },
    lookAt: (eye, target, up) => {
      const [ex, ey, ez] = eye;
      const [tx, ty, tz] = target;
      const [ux, uy, uz] = up;

      // front
      let zx = ex - tx, zy = ey - ty, zz = ez - tz;
      let len = Math.sqrt(zx * zx + zy * zy + zz * zz);
      if (len > 0) { len = 1 / len; zx *= len; zy *= len; zz *= len; }

      // 右向量
      let xx = uy * zz - uz * zy, xy = uz * zx - ux * zz, xz = ux * zy - uy * zx;
      len = Math.sqrt(xx * xx + xy * xy + xz * xz);
      if (len > 0) { len = 1 / len; xx *= len; xy *= len; xz *= len; }

      // up
      let yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;

      return [
        xx, yx, zx, 0,
        xy, yy, zy, 0,
        xz, yz, zz, 0,
        -(xx * ex + xy * ey + xz * ez),
        -(yx * ex + yy * ey + yz * ez),
        -(zx * ex + zy * ey + zz * ez),
        1
      ];
    },
    v3_add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
    v3_sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
    v3_mul: (a, b) => [a[0] * b[0], a[1] * b[1], a[2] * b[2]],
    v3_normalize: (v) => {
      const l = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
      return l > 0 ? [v[0] / l, v[1] / l, v[2] / l] : [0, 0, 0];
    },
    v3_transform: (v, m) => [
      v[0] * m[0] + v[1] * m[4] + v[2] * m[8] + m[12],
      v[0] * m[1] + v[1] * m[5] + v[2] * m[9] + m[13],
      v[0] * m[2] + v[1] * m[6] + v[2] * m[10] + m[14]
    ]
  };

  // ==========================================
  // 独立图层管理
  // ==========================================
  const shaders = new Map();
  const vaos = new Map();
  const fbos = new Map();
  const textures = new Map();
  const vbos = [];
  const rbos = [];

  const vectors = new Map();

  let skinId = null;
  let drawableId = null;

  function updateCanvasSize() {
    canvas3d.width = renderer.canvas.width;
    canvas3d.height = renderer.canvas.height;
    if (gl3d) gl3d.viewport(0, 0, canvas3d.width, canvas3d.height);
  }

  function setupLayer() {
    if (skinId !== null) return;
    const mainRenderer = vm.renderer;
    updateCanvasSize();

    let index = mainRenderer._groupOrdering.indexOf("video");
    mainRenderer._groupOrdering.splice(index + 1, 0, "vapor3D");
    mainRenderer._layerGroups["vapor3D"] = {
      groupIndex: 0,
      drawListOffset: mainRenderer._layerGroups["video"].drawListOffset,
    };
    for (let i = 0; i < mainRenderer._groupOrdering.length; i++) {
      mainRenderer._layerGroups[mainRenderer._groupOrdering[i]].groupIndex = i;
    }

    skinId = mainRenderer.createBitmapSkin(new ImageData(canvas3d.width, canvas3d.height));
    drawableId = mainRenderer.createDrawable("vapor3D");
    mainRenderer.updateDrawableSkinId(drawableId, skinId);

    // 全屏对齐，也可通过积木修改
    const skin = mainRenderer._allSkins[skinId];
    if (skin.setNativeSize) skin.setNativeSize(canvas3d.width, canvas3d.height);
    mainRenderer.updateDrawablePosition(drawableId, [0, 0]);
    mainRenderer.updateDrawableScale(drawableId, [200, 200]);
  }

  // ==========================================
  // 通用
  // ==========================================

  const _parseInput = (input, util) => {
    if (typeof input === "string" && input.startsWith("[")) {
      try { return JSON.parse(input); } catch (e) { return null; }
    }
    const list = util.target.lookupVariableByNameAndType(input, "list");
    return list ? list.value.map(Number) : null;
  };

  const _getList = (name, util) => {
    if (!name) return null;
    const list = util.target.lookupVariableByNameAndType(name, "list");
    if (!list) return null;
    return list.value.map(Number); // 转换为 TypedArray 之前必须是 Number
  };
  const _getAllLists = () => {
    const stage = vm.runtime.getTargetForStage();
    const editingTarget = vm.editingTarget || stage;
    const lists = ["NONE"];

    // 获取当前选中的角色（Sprite）的私有列表
    if (editingTarget && editingTarget.variables) {
      Object.values(editingTarget.variables)
        .filter(v => v.type === 'list')
        .forEach(v => lists.push(v.name));
    }

    // 获取舞台（Stage）的全局列表
    if (stage && stage !== editingTarget && stage.variables) {
      Object.values(stage.variables)
        .filter(v => v.type === 'list')
        .forEach(v => {
          if (!lists.includes(v.name)) lists.push(v.name);
        });
    }

    return lists;
  }
  // ==========================================
  // 纹理池
  // ==========================================
  const texturePool = {
    cache: new Map(),

    // 检查是否存在
    has(name) { return this.cache.has(name); },

    // 渲染循环中获取 ID
    getId(name) { return this.cache.get(name)?.id; },

    // 渲染循环中获取 WebGL 对象
    get(name) { return this.cache.get(name)?.texture; },

    // 添加纹理
    set(name, id, texture) { this.cache.set(name, { id, texture }); },

    destroy(name) {
      const item = this.cache.get(name);
      if (item) {
        gl3d.deleteTexture(item.texture);
        this.cache.delete(name);
      }
    },

    clearAll() {
      this.cache.forEach((item) => {
        gl3d.deleteTexture(item.texture);
      });
      this.cache.clear();
    }
  };

  // ==========================================
  // 核心
  // ==========================================
  class Vapor3D {
    getInfo() {
      return {
        id: "vapor3D",
        name: "Vapor 3D",
        color1: "#2f2f36",
        blocks: [
          { opcode: "gl_Init", blockType: "command", text: "init WebGL" },
          { opcode: "gl_ResetResources", blockType: "command", text: "reset all" },
          { opcode: "gl_Clear", blockType: "command", text: "glClear [BIT]", arguments: { BIT: { type: "string", menu: "clearMenu" } } },
          {
            opcode: "gl_SetResolution",
            blockType: "command",
            text: "set canvas resolution [W] x [H]",
            arguments: {
              W: { type: "number", defaultValue: 480 },
              H: { type: "number", defaultValue: 360 }
            }
          },
          {
            opcode: "gl_SetLayerScale",
            blockType: "command",
            text: "set canvas scale X [SX]% Y [SY]%",
            arguments: {
              SX: { type: "number", defaultValue: 100 },
              SY: { type: "number", defaultValue: 100 }
            }
          },
          {
            opcode: "gl_SetClearColor",
            blockType: "command",
            text: "glClearColor R [R] G [G] B [B] A [A]",
            arguments: {
              R: { type: "number", defaultValue: 0 },
              G: { type: "number", defaultValue: 0 },
              B: { type: "number", defaultValue: 0 },
              A: { type: "number", defaultValue: 0 }
            }
          },

          "---",
          { blockType: "label", text: "Shader" },

          { opcode: "shader_Create", blockType: "command", text: "create shader [ID] VS [VS] FS [FS]", arguments: { ID: { type: "string" }, VS: { type: "string" }, FS: { type: "string" } } },
          { opcode: "shader_Use", blockType: "command", text: "shader.use([ID])", arguments: { ID: { type: "string" } } },
          { opcode: "shader_SetMat4", blockType: "command", text: "shader [ID] setMat4 [NAME] [VAL]", arguments: { ID: { type: "string" }, NAME: { type: "string" }, VAL: { type: "string" } } },
          {
            opcode: "shader_SetVec2",
            blockType: "command",
            text: "shader [ID] setVec2 [NAME] X [X] Y [Y]",
            arguments: {
              ID: { type: "string" },
              NAME: { type: "string" },
              X: { type: "number", defaultValue: 0 },
              Y: { type: "number", defaultValue: 0 }
            }
          },
          { opcode: "shader_SetVec3", blockType: "command", text: "shader [ID] setVec3 [NAME] X [X] Y [Y] Z [Z]", arguments: { ID: { type: "string" }, NAME: { type: "string" }, X: { type: "number" }, Y: { type: "number" }, Z: { type: "number" } } },
          {
            opcode: "shader_SetFloat",
            blockType: "command",
            text: "shader [ID] setFloat [NAME] to [V]",
            arguments: {
              ID: { type: "string" },
              NAME: { type: "string" },
              V: { type: "number", defaultValue: 0 }
            }
          },
          { opcode: "shader_SetInt", blockType: "command", text: "shader [ID] setInt [NAME] [V]", arguments: { ID: { type: "string" }, NAME: { type: "string" }, V: { type: "number" } } },

          "---",
          { blockType: "label", text: "Framebuffer" },

          {
            opcode: "fbo_Create",
            blockType: "command",
            text: "create FBO [ID] size [W]x[H] Slot0 [A0] Slot1 [A1] Slot2 [A2] Slot3 [A3] Depth [D]",
            arguments: {
              ID: { type: "string", defaultValue: "fbo1" },
              W: { type: "number", defaultValue: 480 },
              H: { type: "number", defaultValue: 360 },
              A0: { type: "string", menu: "fboTypeMenu", defaultValue: "RGBA8" },
              A1: { type: "string", menu: "fboTypeMenu", defaultValue: "NONE" },
              A2: { type: "string", menu: "fboTypeMenu", defaultValue: "NONE" },
              A3: { type: "string", menu: "fboTypeMenu", defaultValue: "NONE" },
              D: { type: "string", menu: "depthMenu", defaultValue: "RBO" }
            }
          },
          { opcode: "fbo_Bind", blockType: "command", text: "glBindFramebuffer [ID]", arguments: { ID: { type: "string" } } },

          "---",
          { blockType: "label", text: "Vertex Array Object" },

          { opcode: "vao_CreateScreenQuad", blockType: "command", text: "Init RenderQuad [ID]", arguments: { ID: { type: "string", defaultValue: "screenQuad" } } },

          {
            opcode: "vao_CreateCustom",
            blockType: "command",
            text: "create VAO [ID] #0 [L0] size [S0] #1 [L1] size [S1] #2 [L2] size [S2] #3 [L3] size [S3] Indices [I]",
            arguments: {
              ID: { type: "string", defaultValue: "sample" },
              L0: { type: "string", menu: "listMenu", defaultValue: "NONE" }, S0: { type: "string", menu: "compSizeMenu", defaultValue: "3" },
              L1: { type: "string", menu: "listMenu", defaultValue: "NONE" }, S1: { type: "string", menu: "compSizeMenu", defaultValue: "2" },
              L2: { type: "string", menu: "listMenu", defaultValue: "NONE" }, S2: { type: "string", menu: "compSizeMenu", defaultValue: "3" },
              L3: { type: "string", menu: "listMenu", defaultValue: "NONE" }, S3: { type: "string", menu: "compSizeMenu", defaultValue: "3" },
              I: { type: "string", menu: "listMenu", defaultValue: "NONE" }
            }
          },

          "---",
          { blockType: "label", text: "Texture" },

          {
            opcode: "tex_LoadFromCostume",
            blockType: "command",
            text: "load costume [C] as texture [NAME]",
            arguments: {
              C: { type: "string", menu: "costumeMenu" },
              NAME: { type: "string", defaultValue: "tex1" }
            }
          },
          {
            opcode: "tex_Destroy",
            blockType: "command",
            text: "destroy texture [NAME]",
            arguments: {
              NAME: { type: "string", menu: "costumeMenu" }
            }
          },
          {
            opcode: "gl_BindTexture",
            blockType: "command",
            text: "glActiveTexture [UNIT] bind [TEX]",
            arguments: {
              TEX: { type: "string" },
              UNIT: { type: "number", defaultValue: 0 }
            }
          },
          {
            opcode: "gl_GenerateMipmap",
            blockType: "command",
            text: "glGenerateMipmap [TEX]",
            arguments: {
              TEX: { type: "string", menu: "costumeMenu" }
            }
          },
          {
            opcode: "tex_SetFilter",
            blockType: "command",
            text: "set texture [TEX] filter mode [MODE]",
            arguments: {
              TEX: { type: "string", menu: "costumeMenu" },
              MODE: { type: "string", menu: "filterMode" }
            }
          },
          {
            opcode: "tex_SetWrap",
            blockType: "command",
            text: "set texture [TEX] wrap mode [AXIS] [MODE]",
            arguments: {
              TEX: { type: "string", menu: "costumeMenu" },
              AXIS: { type: "string", menu: "wrapAxis" },
              MODE: { type: "string", menu: "wrapMode" }
            }
          },

          "---",
          { blockType: "label", text: "Render" },

          { opcode: "gl_Draw", blockType: "command", text: "glDraw [ID] count [COUNT] mode [MODE]", arguments: { ID: { type: "string", defaultValue: "sample" }, COUNT: { type: "number" }, MODE: { type: "string", menu: "drawMode" } } },
          { opcode: "gl_Present", blockType: "command", text: "update layer" },

          "---",
          { blockType: "label", text: "GL States" },

          { opcode: "st_Enable", blockType: "command", text: "glEnable [CAP]", arguments: { CAP: { type: "string", menu: "capMenu" } } },
          { opcode: "st_Disable", blockType: "command", text: "glDisable [CAP]", arguments: { CAP: { type: "string", menu: "capMenu" } } },

          "---",
          { blockType: "label", text: "Stencil" },

          { opcode: "st_StencilOp", blockType: "command", text: "glStencilOp [SF] [DF] [DP]", arguments: { SF: { type: "string", menu: "opMenu" }, DF: { type: "string", menu: "opMenu" }, DP: { type: "string", menu: "opMenu" } } },

          "---",
          { blockType: "label", text: "Math" },

          {
            opcode: "v3_Init", blockType: "command", text: "vec3 [ID] = X [X] Y [Y] Z [Z]",
            arguments: { ID: { type: "string", defaultValue: "v1" }, X: { type: "number" }, Y: { type: "number" }, Z: { type: "number" } }
          },
          {
            opcode: "v3_Modify", blockType: "command", text: "vec3 [ID] [OP] [OTHER]",
            arguments: { ID: { type: "string", defaultValue: "v1" }, OP: { type: "string", menu: "v3OpMenu" }, OTHER: { type: "string", defaultValue: "v2" } }
          },
          {
            opcode: "v3_ApplyMatrix", blockType: "command", text: "vec3 [ID] apply mat4 [M]",
            arguments: { ID: { type: "string", defaultValue: "v1" }, M: { type: "string" } }
          },
          {
            opcode: "v3_Get", blockType: "reporter", text: "vec3 [ID] 's [COMP]",
            arguments: { ID: { type: "string", defaultValue: "v1" }, COMP: { type: "string", menu: "v3CompMenu" } }
          },
          { opcode: "m4_Identity", blockType: "reporter", text: "glm::mat4" },
          { opcode: "m4_Perspective", blockType: "reporter", text: "glm::perspective [F] [A] [N] [F2]", arguments: { F: { type: "number", defaultValue: 45 }, A: { type: "number", defaultValue: 1.33 }, N: { type: "number", defaultValue: 0.1 }, F2: { type: "number", defaultValue: 100 } } },
          {
            opcode: "m4_LookAt", blockType: "reporter", text: "glm::lookAt Eye[EX],[EY],[EZ] Target[TX],[TY],[TZ] Up[UX],[UY],[UZ]", arguments: {
              EX: { type: "number", defaultValue: 0 }, EY: { type: "number", defaultValue: 0 }, EZ: { type: "number", defaultValue: 5 },
              TX: { type: "number", defaultValue: 0 }, TY: { type: "number", defaultValue: 0 }, TZ: { type: "number", defaultValue: 0 },
              UX: { type: "number", defaultValue: 0 }, UY: { type: "number", defaultValue: 1 }, UZ: { type: "number", defaultValue: 0 }
            }
          },
          { opcode: "m4_Translate", blockType: "reporter", text: "glm::translate [M] [X] [Y] [Z]", arguments: { M: { type: "string" }, X: { type: "number" }, Y: { type: "number" }, Z: { type: "number" } } },
          { opcode: "m4_Rotate", blockType: "reporter", text: "glm::rotate [M] [AXIS] [DEG]", arguments: { M: { type: "string" }, AXIS: { type: "string", menu: "axisMenu" }, DEG: { type: "number" } } },
          { opcode: "m4_Multiply", blockType: "reporter", text: "glm:: [A] * [B]", arguments: { A: { type: "string" }, B: { type: "string" } } },
        ],
        menus: {
          clearMenu: ["COLOR_BUFFER_BIT", "DEPTH_BUFFER_BIT", "STENCIL_BUFFER_BIT", "ALL"],
          drawMode: ["TRIANGLES", "TRIANGLE_STRIP", "LINES", "POINTS"],
          capMenu: ["DEPTH_TEST", "STENCIL_TEST", "BLEND", "CULL_FACE"],
          opMenu: ["KEEP", "ZERO", "REPLACE", "INCR", "INCR_WRAP", "DECR", "DECR_WRAP", "INVERT"],
          axisMenu: ["X", "Y", "Z"],
          v3OpMenu: ["+", "-", "mul"],
          v3CompMenu: ["X", "Y", "Z"],
          costumeMenu: { acceptReporters: true, items: "tex_getCostumes"},
          listMenu: { acceptReporters: true, items: "getAllLists" },
          compSizeMenu: ["1", "2", "3", "4"],
          fboTypeMenu: ["RGB16F", "RGBA16F", "RGB32F", "RGB8", "RGBA8", "R11G11B10F", "R16F", "RG16F", "NONE"],
          depthMenu: ["RBO", "TEXTURE","NONE"],
          filterMode: ["NEAREST","LINEAR","NEAREST_MIPMAP_NEAREST","LINEAR_MIPMAP_NEAREST","NEAREST_MIPMAP_LINEAR","LINEAR_MIPMAP_LINEAR"],
          wrapAxis: ["S","T"],
          wrapMode: ["REPEAT","CLAMP_TO_EDGE","MIRRORED_REPEAT"],
        }
      };
    }

    getAllLists() {
      return _getAllLists();
    }

    gl_Init() {
      setupLayer();
      const ext = gl3d.getExtension('EXT_color_buffer_float');
      if (!ext) {
        console.error("Vapor3D: 此设备不支持RGBA16F");
      }
      gl3d.enable(gl3d.DEPTH_TEST);
      gl3d.enable(gl3d.STENCIL_TEST);
    }

    gl_SetResolution({ W, H }) {
      if (!gl3d || skinId === null) return;

      canvas3d.width = W;
      canvas3d.height = H;
      gl3d.viewport(0, 0, W, H);

      // 通知 Scratch 渲染器更新皮肤
      const skin = renderer._allSkins[skinId];
      if (skin && skin.setNativeSize) {
        skin.setNativeSize(W, H);
      }

    }

    gl_SetLayerScale({ SX, SY }) {
      if (drawableId === null) return;
      renderer.updateDrawableScale(drawableId, [SX, SY]);
    }

    gl_ResetResources() {
      shaders.forEach(p => gl3d.deleteProgram(p));
      shaders.clear();
      fbos.forEach(f => gl3d.deleteFramebuffer(f));
      fbos.clear();
      vaos.forEach(v => gl3d.deleteVertexArray(v.vao));
      vaos.clear();
      vbos.forEach(b => gl3d.deleteBuffer(b));
      vbos.length = 0;
      rbos.forEach(r => gl3d.deleteRenderbuffer(r));
      rbos.length = 0;
      texturePool.clearAll();
      textures.forEach(t => {
        if (t instanceof WebGLTexture) gl3d.deleteTexture(t);
      });
      textures.clear();
      
      vectors.clear();
    }

    gl_Clear({ BIT }) {
      let m = (BIT === "ALL") ? (gl3d.COLOR_BUFFER_BIT | gl3d.DEPTH_BUFFER_BIT | gl3d.STENCIL_BUFFER_BIT) : gl3d[BIT];
      gl3d.clear(m);
    }

    gl_SetClearColor({ R, G, B, A }) { gl3d.clearColor(R, G, B, A); }

    shader_Create({ ID, VS, FS }) {
      const fixGLSL = (src) => {
        if (!src) return "";
        let s = src.trim();

        s = s.replace(/\/\*[\s\S]*?\*\//g, '');
        s = s.replace(/\/\/.*/g, (match) => match + "\n");

        if (s.includes('#version')) {
          s = s.replace(/(#version\s+300\s+es)\s*/, "$1\n");
        }
        // 补换行
        const lineCount = (s.match(/\n/g) || []).length;
        if (lineCount < 3) {
          s = s.replace(/;/g, ";\n")
            .replace(/{/g, "{\n")
            .replace(/}/g, "}\n");
        }

        // 清理每一行的首尾空格，移除多余空行
        return s.split('\n').map(line => line.trim()).filter(line => line.length > 0).join('\n');
      };

      const vSrc = fixGLSL(VS);
      const fSrc = fixGLSL(FS);

      // 检查 ID 是否存在且源码是否有效
      if (vSrc.length < 10 || shaders.has(ID)) return;

      const c = (s, t) => {
        const o = gl3d.createShader(t);
        gl3d.shaderSource(o, s);
        gl3d.compileShader(o);
        if (!gl3d.getShaderParameter(o, gl3d.COMPILE_STATUS)) {
          const type = t === gl3d.VERTEX_SHADER ? "Vertex" : "Fragment";
          console.error(`Vapor3D ${type} Shader Error (${ID}):`, gl3d.getShaderInfoLog(o));
          console.log("%c Processed GLSL Source: ", "\n" + s);
          return null;
        }
        return o;
      };

      const v = c(vSrc, gl3d.VERTEX_SHADER);
      const f = c(fSrc, gl3d.FRAGMENT_SHADER);
      if (!v || !f) return;

      const p = gl3d.createProgram();
      gl3d.attachShader(p, v);
      gl3d.attachShader(p, f);
      gl3d.linkProgram(p);

      if (!gl3d.getProgramParameter(p, gl3d.LINK_STATUS)) {
        console.error("Link Error:", gl3d.getProgramInfoLog(p));
        return;
      }
      shaders.set(ID, p);
    }

    shader_Use({ ID }) { gl3d.useProgram(shaders.get(ID) || null); }

    shader_SetMat4({ ID, NAME, VAL }, util) {
      const p = shaders.get(ID); const m = _parseInput(VAL, util);
      if (p && m) gl3d.uniformMatrix4fv(gl3d.getUniformLocation(p, NAME), false, new Float32Array(m));
    }

    shader_SetVec3({ ID, NAME, X, Y, Z }) {
      const p = shaders.get(ID); if (p) gl3d.uniform3f(gl3d.getUniformLocation(p, NAME), X, Y, Z);
    }

    shader_SetVec2({ ID, NAME, X, Y }) {
      const p = shaders.get(ID);
      if (p) {
        gl3d.useProgram(p);
        const loc = gl3d.getUniformLocation(p, NAME);
        gl3d.uniform2f(loc, X, Y);
      }
    }

    shader_SetFloat({ ID, NAME, V }) {
      const p = shaders.get(ID);
      if (p) {
        gl3d.useProgram(p);
        const loc = gl3d.getUniformLocation(p, NAME);
        gl3d.uniform1f(loc, V);
      }
    }

    shader_SetInt({ ID, NAME, V }) {
      const p = shaders.get(ID); if (p) gl3d.uniform1i(gl3d.getUniformLocation(p, NAME), V);
    }

    fbo_Create({ ID, W, H, A0, A1, A2, A3, D }) {
      if (fbos.has(ID)) return;

      const fbo = gl3d.createFramebuffer();
      gl3d.bindFramebuffer(gl3d.FRAMEBUFFER, fbo);

      const configs = [A0, A1, A2, A3];
      const activeAttachments = [];

      // 格式映射表
      const formatMap = {
        // HDR
        "RGB16F": { internal: gl3d.RGB16F, format: gl3d.RGB, type: gl3d.HALF_FLOAT },
        "RGBA16F": { internal: gl3d.RGBA16F, format: gl3d.RGBA, type: gl3d.HALF_FLOAT },
        "RGB32F": { internal: gl3d.RGB32F, format: gl3d.RGB, type: gl3d.FLOAT },

        // 标准 LDR (8位)
        "RGB8": { internal: gl3d.RGB8, format: gl3d.RGB, type: gl3d.UNSIGNED_BYTE },
        "RGBA8": { internal: gl3d.RGBA8, format: gl3d.RGBA, type: gl3d.UNSIGNED_BYTE },

        // PBR 合并参数用的，参考glTF
        "R11G11B10F": { internal: gl3d.R11F_G11F_B10F, format: gl3d.RGB, type: gl3d.FLOAT },

        // 单通道/双通道
        "R16F": { internal: gl3d.R16F, format: gl3d.RED, type: gl3d.HALF_FLOAT },
        "RG16F": { internal: gl3d.RG16F, format: gl3d.RG, type: gl3d.HALF_FLOAT },

        "NONE": null
      };

      configs.forEach((typeStr, i) => {
        if (typeStr === "NONE") return;

        const conf = formatMap[typeStr];
        const tex = gl3d.createTexture();
        gl3d.bindTexture(gl3d.TEXTURE_2D, tex);

        gl3d.texImage2D(gl3d.TEXTURE_2D, 0, conf.internal, W, H, 0, conf.format, conf.type, null);

        gl3d.texParameteri(gl3d.TEXTURE_2D, gl3d.TEXTURE_MIN_FILTER, gl3d.LINEAR);
        gl3d.texParameteri(gl3d.TEXTURE_2D, gl3d.TEXTURE_MAG_FILTER, gl3d.LINEAR);
        gl3d.texParameteri(gl3d.TEXTURE_2D, gl3d.TEXTURE_WRAP_S, gl3d.CLAMP_TO_EDGE);
        gl3d.texParameteri(gl3d.TEXTURE_2D, gl3d.TEXTURE_WRAP_T, gl3d.CLAMP_TO_EDGE);

        // 挂载到 FBO
        const attachmentPoint = gl3d.COLOR_ATTACHMENT0 + i;
        gl3d.framebufferTexture2D(gl3d.FRAMEBUFFER, attachmentPoint, gl3d.TEXTURE_2D, tex, 0);

        // 保存纹理引用，方便后续调用
        textures.set(`${ID}_tex${i}`, tex);
        activeAttachments.push(attachmentPoint);
      });

      // 告诉 WebGL 哪些槽位需要输出颜色
      if (activeAttachments.length > 0) {
        gl3d.drawBuffers(activeAttachments);
      } else {
        gl3d.drawBuffers([gl3d.NONE]);
      }

      if (D === "RBO") {
        // 仅用于渲染加速，不可读
        const rbo = gl3d.createRenderbuffer();
        gl3d.bindRenderbuffer(gl3d.RENDERBUFFER, rbo);
        gl3d.renderbufferStorage(gl3d.RENDERBUFFER, gl3d.DEPTH24_STENCIL8, W, H);
        gl3d.framebufferRenderbuffer(gl3d.FRAMEBUFFER, gl3d.DEPTH_STENCIL_ATTACHMENT, gl3d.RENDERBUFFER, rbo);
        rbos.push(rbo);
      }
      else if (D === "TEXTURE") {
        // 可采样
        const depthTex = gl3d.createTexture();
        gl3d.bindTexture(gl3d.TEXTURE_2D, depthTex);

        gl3d.texImage2D(
          gl3d.TEXTURE_2D, 0, gl3d.DEPTH24_STENCIL8,
          W, H, 0, gl3d.DEPTH_STENCIL, gl3d.UNSIGNED_INT_24_8, null
        );

        gl3d.texParameteri(gl3d.TEXTURE_2D, gl3d.TEXTURE_MIN_FILTER, gl3d.NEAREST);
        gl3d.texParameteri(gl3d.TEXTURE_2D, gl3d.TEXTURE_MAG_FILTER, gl3d.NEAREST);
        gl3d.texParameteri(gl3d.TEXTURE_2D, gl3d.TEXTURE_WRAP_S, gl3d.CLAMP_TO_EDGE);
        gl3d.texParameteri(gl3d.TEXTURE_2D, gl3d.TEXTURE_WRAP_T, gl3d.CLAMP_TO_EDGE);

        // 挂载到 FBO 的深度模板附件点
        gl3d.framebufferTexture2D(
          gl3d.FRAMEBUFFER, gl3d.DEPTH_STENCIL_ATTACHMENT,
          gl3d.TEXTURE_2D, depthTex, 0
        );

        textures.set(`${ID}_depth`, depthTex);
      }

      const status = gl3d.checkFramebufferStatus(gl3d.FRAMEBUFFER);
      if (status !== gl3d.FRAMEBUFFER_COMPLETE) {
        console.error(`Vapor3D: FBO "${ID}" is incomplete! Status: ${status}`);
      }

      fbos.set(ID, fbo);
      gl3d.bindFramebuffer(gl3d.FRAMEBUFFER, null);
    }

    fbo_Bind({ ID }) { gl3d.bindFramebuffer(gl3d.FRAMEBUFFER, fbos.get(ID) || null); }

    vao_CreateScreenQuad({ ID }) {
      if (vaos.has(ID)) return;
      const pos = [-1, 1, 0, -1, -1, 0, 1, 1, 0, 1, 1, 0, -1, -1, 0, 1, -1, 0];
      const uv = [0, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 0];
      const vao = gl3d.createVertexArray(); gl3d.bindVertexArray(vao);
      const b = (d, l, s) => {
        const buf = gl3d.createBuffer(); gl3d.bindBuffer(gl3d.ARRAY_BUFFER, buf);
        gl3d.bufferData(gl3d.ARRAY_BUFFER, new Float32Array(d), gl3d.STATIC_DRAW);
        gl3d.enableVertexAttribArray(l); gl3d.vertexAttribPointer(l, s, gl3d.FLOAT, false, 0, 0);
        vbos.push(buf);
      };
      b(pos, 0, 3); b(uv, 1, 2);
      vaos.set(ID, { vao, hasElements: false }); gl3d.bindVertexArray(null);
      vaos.set(ID, { vao, hasElements: false, defaultCount: 6 });
    }

    vao_CreateCustom({ ID, L0, S0, L1, S1, L2, S2, L3, S3, I }, util) {
      if (vaos.has(ID)) return;

      const vao = gl3d.createVertexArray();
      gl3d.bindVertexArray(vao);

      // 将参数组织成数组，方便循环处理
      const slots = [
        { list: L0, size: parseInt(S0), loc: 0 },
        { list: L1, size: parseInt(S1), loc: 1 },
        { list: L2, size: parseInt(S2), loc: 2 },
        { list: L3, size: parseInt(S3), loc: 3 }
      ];

      let drawCount = 0;

      slots.forEach(slot => {
        if (slot.list === "NONE") return;

        const data = _getList(slot.list, util);
        if (!data || data.length === 0) return;

        // 用第一个有效属性的长度来计算顶点总数
        if (drawCount === 0) drawCount = data.length / slot.size;

        const buf = gl3d.createBuffer();
        gl3d.bindBuffer(gl3d.ARRAY_BUFFER, buf);
        gl3d.bufferData(gl3d.ARRAY_BUFFER, new Float32Array(data), gl3d.STATIC_DRAW);

        gl3d.enableVertexAttribArray(slot.loc);
        gl3d.vertexAttribPointer(slot.loc, slot.size, gl3d.FLOAT, false, 0, 0);
        vbos.push(buf);
      });

      // 索引
      let hasElements = false;
      if (I !== "NONE") {
        const idxData = _getList(I, util);
        if (idxData && idxData.length > 0) {
          const eb = gl3d.createBuffer();
          gl3d.bindBuffer(gl3d.ELEMENT_ARRAY_BUFFER, eb);
          gl3d.bufferData(gl3d.ELEMENT_ARRAY_BUFFER, new Uint32Array(idxData), gl3d.STATIC_DRAW);
          vbos.push(eb);
          hasElements = true;
          drawCount = idxData.length;
        }
      }

      vaos.set(ID, { vao, hasElements, defaultCount: drawCount });
      gl3d.bindVertexArray(null);
    }

    gl_Draw({ ID, COUNT, MODE }) {
      const entry = vaos.get(ID);
      if (!entry) return;

      gl3d.bindVertexArray(entry.vao);

      let drawCount = COUNT;
      if (COUNT === "" || COUNT === null || COUNT === -1 || COUNT === undefined) {
        drawCount = entry.defaultCount;
      }

      if (entry.hasElements) {
        gl3d.drawElements(gl3d[MODE], drawCount, gl3d.UNSIGNED_INT, 0);
      } else {
        gl3d.drawArrays(gl3d[MODE], 0, drawCount);
      }

      gl3d.bindVertexArray(null);
    }

    gl_Present() {
      if (skinId === null) return;
      try {

        const mainRenderer = vm.renderer;
        const mainGL = mainRenderer.gl;
        const skin = mainRenderer._allSkins[skinId];

        // 绑定 Scratch 的主纹理
        mainGL.bindTexture(mainGL.TEXTURE_2D, skin._texture);

        // 禁用 Alpha 预乘
        mainGL.pixelStorei(mainGL.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);

        // 直接将 Vapor3D 的 canvas3d 内容上传到 Scratch 的主纹理
        mainGL.texImage2D(
          mainGL.TEXTURE_2D,
          0,
          mainGL.RGBA,
          mainGL.RGBA,
          mainGL.UNSIGNED_BYTE,
          canvas3d
        );
        skin.emitWasAltered();

      } catch (e) {
        console.error("Vapor3D: Frame transfer failed", e);
      }

      runtime.requestRedraw();
    }

    st_Enable({ CAP }) { gl3d.enable(gl3d[CAP]); }
    st_Disable({ CAP }) { gl3d.disable(gl3d[CAP]); }
    st_StencilOp({ SF, DF, DP }) { gl3d.stencilOp(gl3d[SF], gl3d[DF], gl3d[DP]); }

    gl_BindTexture({ TEX, UNIT }) {
      gl3d.activeTexture(gl3d.TEXTURE0 + UNIT);

      const texObject = textures.get(TEX);

      if (texObject instanceof WebGLTexture) {
        gl3d.bindTexture(gl3d.TEXTURE_2D, texObject);
      } else {
        gl3d.bindTexture(gl3d.TEXTURE_2D, null);
      }
    }
    tex_SetFilter({ TEX, MODE }) {
      const texObject = textures.get(TEX);
      if (!texObject) return;

      const modeMap = {
        "LINEAR": gl3d.LINEAR,
        "NEAREST": gl3d.NEAREST,
        "LINEAR_MIPMAP_LINEAR": gl3d.LINEAR_MIPMAP_LINEAR,
      };

      gl3d.bindTexture(gl3d.TEXTURE_2D, texObject);
      gl3d.texParameteri(gl3d.TEXTURE_2D, gl3d.TEXTURE_MIN_FILTER, modeMap[MODE]);
      gl3d.texParameteri(gl3d.TEXTURE_2D, gl3d.TEXTURE_MAG_FILTER, modeMap[MODE]);
    }
    tex_SetWrap({ TEX, AXIS, MODE }) {
      const texObject = textures.get(TEX);
      if (!texObject) return;

      const axisMap = { "S": gl3d.TEXTURE_WRAP_S, "T": gl3d.TEXTURE_WRAP_T };
      const modeMap = { "REPEAT": gl3d.REPEAT, "CLAMP": gl3d.CLAMP_TO_EDGE };

      gl3d.bindTexture(gl3d.TEXTURE_2D, texObject);
      gl3d.texParameteri(gl3d.TEXTURE_2D, axisMap[AXIS], modeMap[MODE]);
    }
    gl_GenerateMipmap({ TEX }) {
      const texObject = textures.get(TEX);
      if (!texObject) {
        console.warn(`Vapor3D: Cannot generate mipmap, texture "${TEX}" not found.`);
        return;
      }
      gl3d.bindTexture(gl3d.TEXTURE_2D, texObject);
      gl3d.generateMipmap(gl3d.TEXTURE_2D);
    }
    tex_getCostumes() {
      return (vm.editingTarget ? vm.editingTarget.getCostumes() : []).map(c => c.name);
    }
    async tex_LoadFromCostume({ C, NAME }, { target }) {

      if (textures.has(NAME)) return;

      const cost = target.sprite.costumes.find(c => c.name === C);
      if (!cost) {
        console.error(`Vapor3D: Costume [${C}] not found in sprite.`);
        return;
      }

      textures.set(NAME, "loading");

      try {
        // Uint8Array
        const assetData = cost.asset.data;
        const assetType = cost.asset.assetType.contentType;

        // 二进制数据转 Blob
        const blob = new Blob([assetData], { type: assetType });

        // createImageBitmap 异步解码
        const bitmap = await createImageBitmap(blob, {
          premultiplyAlpha: 'none',
          colorSpaceConversion: 'none'
        });

        const tex = gl3d.createTexture();
        gl3d.bindTexture(gl3d.TEXTURE_2D, tex);
        gl3d.texParameteri(gl3d.TEXTURE_2D, gl3d.TEXTURE_WRAP_S, gl3d.CLAMP_TO_EDGE);
        gl3d.texParameteri(gl3d.TEXTURE_2D, gl3d.TEXTURE_WRAP_T, gl3d.CLAMP_TO_EDGE);
        gl3d.texParameteri(gl3d.TEXTURE_2D, gl3d.TEXTURE_MIN_FILTER, gl3d.LINEAR);
        gl3d.texParameteri(gl3d.TEXTURE_2D, gl3d.TEXTURE_MAG_FILTER, gl3d.LINEAR);
        gl3d.texImage2D(gl3d.TEXTURE_2D, 0, gl3d.RGBA, gl3d.RGBA, gl3d.UNSIGNED_BYTE, bitmap);

        bitmap.close();

        textures.set(NAME, tex);
        console.log(`Vapor3D: Texture [${NAME}] loaded successfully (Async).`);

      } catch (e) {
        textures.delete(NAME);
        console.error(`Vapor3D: Failed to load texture [${NAME}]:`, e);
      }
    }
    tex_Destroy({ NAME }) {
      const item = texturePool.cache.get(NAME);
      if (item) {
        textures.delete(item.id);
      }
      texturePool.destroy(NAME);
    }

    m4_Identity() {
      return JSON.stringify(m4.identity());
    }

    m4_Perspective({ F, A, N, F2 }) {
      const mat = m4.perspective(F * Math.PI / 180, A, N, F2);
      return JSON.stringify(mat);
    }

    m4_LookAt({ EX, EY, EZ, TX, TY, TZ, UX, UY, UZ }) {
      const mat = m4.lookAt([EX, EY, EZ], [TX, TY, TZ], [UX, UY, UZ]);
      return JSON.stringify(mat);
    }

    m4_Translate({ M, X, Y, Z }, util) {
      // _parseInput 会处理 M 是嵌套积木传来的 JSON 还是列表名
      const baseMat = _parseInput(M, util) || m4.identity();
      const mat = m4.translate(baseMat, X, Y, Z);
      return JSON.stringify(mat);
    }

    m4_Rotate({ M, AXIS, DEG }, util) {
      const baseMat = _parseInput(M, util) || m4.identity();
      const rad = DEG * Math.PI / 180;
      let mat;
      if (AXIS === "X") mat = m4.xRotate(baseMat, rad);
      else if (AXIS === "Y") mat = m4.yRotate(baseMat, rad);
      else mat = m4.zRotate(baseMat, rad); // Z 轴
      return JSON.stringify(mat);
    }

    m4_Multiply({ A, B }, util) {
      const matA = _parseInput(A, util) || m4.identity();
      const matB = _parseInput(B, util) || m4.identity();
      const mat = m4.multiply(matA, matB);
      return JSON.stringify(mat);
    }

    // 没写，留在这
    m4_Inverse({ M }, util) {
      const baseMat = _parseInput(M, util) || m4.identity();
      const mat = m4.inverse(baseMat) || m4.identity();
      return JSON.stringify(mat);
    }

    v3_Init({ ID, X, Y, Z }) {
      vectors.set(ID, [X, Y, Z]);
    }

    v3_Modify({ ID, OP, OTHER }) {
      const a = vectors.get(ID);
      const b = vectors.get(OTHER);
      if (!a || !b) return;

      let result;
      if (OP === "+") result = m4.v3_add(a, b);
      else if (OP === "-") result = m4.v3_sub(a, b);
      else if (OP === "mul") result = m4.v3_mul(a, b);

      if (result) vectors.set(ID, result);
    }

    v3_Normalize({ ID }) {
      const v = vectors.get(ID);
      if (v) vectors.set(ID, m4.v3_normalize(v));
    }

    v3_ApplyMatrix({ ID, M }, util) {
      const v = vectors.get(ID);
      const mat = _parseInput(M, util) || m4.identity();
      if (v) vectors.set(ID, m4.v3_transform(v, mat));
    }

    v3_Get({ ID, COMP }) {
      const v = vectors.get(ID);
      if (!v) return 0;
      const map = { "X": 0, "Y": 1, "Z": 2 };
      return v[map[COMP]] ?? 0;
    }
  }

  const vapor3DInstance = new Vapor3D();

  runtime.on('PROJECT_STOP_ALL', () => {
    console.log("Vapor3D: Project stopped, clearing resources...");
    vapor3DInstance.gl_ResetResources();
  });
  runtime.on('PROJECT_LOADED', () => {
    vapor3DInstance.gl_ResetResources();
  });

  Scratch.extensions.register(vapor3DInstance);
})(Scratch);