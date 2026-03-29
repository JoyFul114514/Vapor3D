// Name: OmniGLB
// ID: omniGLB
// Description: Better GLB loader
// By: Joy_Ful <https://github.com/JoyFul721>
// License: MPL-2.0 AND BSD-3-Clause
// Version: 1.5.0 - Tailored

(function (Scratch) {
    'use strict';

    let runtime = null; // 参考的JSON扩展，在vm被篡改前劫持
    if (Scratch.vm) {
        runtime = Scratch.vm.runtime;
    }

    const D2R = Math.PI / 180;
    const R2D = 180 / Math.PI;

    function multiply(a, b) {
        const out = new Float32Array(16);
        const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3], a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7], a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11], a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
        let b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
        out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30; out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31; out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32; out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
        b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
        out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30; out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31; out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32; out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
        b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
        out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30; out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31; out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32; out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
        b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
        out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30; out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31; out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32; out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
        return out;
    }
    function inverse(m) {
        const out = new Float32Array(16);
        const m00 = m[0], m01 = m[1], m02 = m[2], m03 = m[3], m10 = m[4], m11 = m[5], m12 = m[6], m13 = m[7], m20 = m[8], m21 = m[9], m22 = m[10], m23 = m[11], m30 = m[12], m31 = m[13], m32 = m[14], m33 = m[15];
        const b00 = m00 * m11 - m01 * m10, b01 = m00 * m12 - m02 * m10, b02 = m00 * m13 - m03 * m10, b03 = m01 * m12 - m02 * m11, b04 = m01 * m13 - m03 * m11, b05 = m02 * m13 - m03 * m12, b06 = m20 * m31 - m21 * m30, b07 = m20 * m32 - m22 * m30, b08 = m20 * m33 - m23 * m30, b09 = m21 * m32 - m22 * m31, b10 = m21 * m33 - m23 * m31, b11 = m22 * m33 - m23 * m32;
        let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
        if (!det) return null; det = 1.0 / det;
        out[0] = (m11 * b11 - m12 * b10 + m13 * b09) * det; out[1] = (m02 * b10 - m01 * b11 - m03 * b09) * det; out[2] = (m31 * b05 - m32 * b04 + m33 * b03) * det; out[3] = (m22 * b04 - m21 * b05 - m23 * b03) * det;
        out[4] = (m12 * b08 - m10 * b11 - m13 * b07) * det; out[5] = (m00 * b11 - m02 * b08 + m03 * b07) * det; out[6] = (m32 * b02 - m30 * b11 - m33 * b01) * det; out[7] = (m20 * b11 - m22 * b02 + m23 * b01) * det;
        out[8] = (m10 * b10 - m11 * b08 + m13 * b06) * det; out[9] = (m01 * b08 - m00 * b10 - m03 * b06) * det; out[10] = (m30 * b10 - m31 * b02 + m33 * b00) * det; out[11] = (m21 * b02 - m20 * b10 - m23 * b00) * det;
        out[12] = (m11 * b07 - m10 * b09 - m12 * b06) * det; out[13] = (m00 * b09 - m01 * b07 + m02 * b06) * det; out[14] = (m31 * b01 - m30 * b05 - m32 * b00) * det; out[15] = (m20 * b05 - m21 * b01 + m22 * b00) * det;
        return out;
    }
    const m4 = {
        identity: () => new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]),
        multiply: multiply,
        slerp: (a, b, t) => {
            let ax = a[0], ay = a[1], az = a[2], aw = a[3];
            let bx = b[0], by = b[1], bz = b[2], bw = b[3];
            let cosom = ax * bx + ay * by + az * bz + aw * bw;
            if (cosom < 0) { cosom = -cosom; bx = -bx; by = -by; bz = -bz; bw = -bw; }
            let s0, s1;
            if (1.0 - cosom > 0.000001) {
                let omega = Math.acos(cosom), sinom = Math.sin(omega);
                s0 = Math.sin((1.0 - t) * omega) / sinom; s1 = Math.sin(t * omega) / sinom;
            } else { s0 = 1.0 - t; s1 = t; }
            return new Float32Array([s0 * ax + s1 * bx, s0 * ay + s1 * by, s0 * az + s1 * bz, s0 * aw + s1 * bw]);
        },
        lerp: (a, b, t) => new Float32Array([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1]), a[2] + t * (b[2] - a[2])]),
        fromRotationTranslation: (q, t, s, out) => {
            if (!out) out = new Float32Array(16);
            const x = q[0], y = q[1], z = q[2], w = q[3];
            const x2 = x + x, y2 = y + y, z2 = z + z;
            const xx = x * x2, xy = x * y2, xz = x * z2, yy = y * y2, yz = y * z2, zz = z * z2;
            const wx = w * x2, wy = w * y2, wz = w * z2;

            const sx = s ? s[0] : 1;
            const sy = s ? s[1] : 1;
            const sz = s ? s[2] : 1;

            out[0] = (1 - (yy + zz)) * sx; out[1] = (xy + wz) * sx; out[2] = (xz - wy) * sx; out[3] = 0;
            out[4] = (xy - wz) * sy; out[5] = (1 - (xx + zz)) * sy; out[6] = (yz + wx) * sy; out[7] = 0;
            out[8] = (xz + wy) * sz; out[9] = (yz - wx) * sz; out[10] = (1 - (xx + yy)) * sz; out[11] = 0;
            out[12] = t[0]; out[13] = t[1]; out[14] = t[2]; out[15] = 1;
            return out;
        },
        decompose: (m) => {
            const sx = Math.hypot(m[0], m[1], m[2]);
            const sy = Math.hypot(m[4], m[5], m[6]);
            const sz = Math.hypot(m[8], m[9], m[10]);
            const t = [m[12], m[13], m[14]];
            let r = [0, 0, 0, 1];
            if (sx > 1e-5 && sy > 1e-5 && sz > 1e-5) {
                const r00 = m[0] / sx, r01 = m[1] / sx, r02 = m[2] / sx, r10 = m[4] / sy, r11 = m[5] / sy, r12 = m[6] / sy, r20 = m[8] / sz, r21 = m[9] / sz, r22 = m[10] / sz;
                const trace = r00 + r11 + r22;
                if (trace > 0) { const S = Math.sqrt(trace + 1.0) * 2; r[3] = 0.25 * S; r[0] = (r12 - r21) / S; r[1] = (r20 - r02) / S; r[2] = (r01 - r10) / S; }
                else if (r00 > r11 && r00 > r22) { const S = Math.sqrt(1.0 + r00 - r11 - r22) * 2; r[3] = (r12 - r21) / S; r[0] = 0.25 * S; r[1] = (r01 + r10) / S; r[2] = (r20 + r02) / S; }
                else if (r11 > r22) { const S = Math.sqrt(1.0 + r11 - r00 - r22) * 2; r[3] = (r20 - r02) / S; r[0] = (r01 + r10) / S; r[1] = 0.25 * S; r[2] = (r12 + r21) / S; }
                else { const S = Math.sqrt(1.0 + r22 - r00 - r11) * 2; r[3] = (r01 - r10) / S; r[0] = (r20 + r02) / S; r[1] = (r12 + r21) / S; r[2] = 0.25 * S; }
            }
            return { t, r, s: [sx, sy, sz] };
        },
        eulerToQuat: (x, y, z) => {
            const c1 = Math.cos(x / 2), c2 = Math.cos(y / 2), c3 = Math.cos(z / 2);
            const s1 = Math.sin(x / 2), s2 = Math.sin(y / 2), s3 = Math.sin(z / 2);

            //  YXZ ，实际顺序ZXY，类比FPS
            return new Float32Array([
                s1 * c2 * c3 + c1 * s2 * s3, // x
                c1 * s2 * c3 - s1 * c2 * s3, // y
                c1 * c2 * s3 - s1 * s2 * c3, // z 
                c1 * c2 * c3 + s1 * s2 * s3  // w 
            ]);
        },
        quatToEuler: (q) => {
            const x = q[0], y = q[1], z = q[2], w = q[3];
            const x2 = x + x, y2 = y + y, z2 = z + z;
            const xx = x * x2, xy = x * y2, xz = x * z2, yy = y * y2, yz = y * z2, zz = z * z2;
            const wx = w * x2, wy = w * y2, wz = w * z2;
            // Pitch (X)
            const sinp = 2 * (w * x - y * z);
            let pitch_x;
            if (Math.abs(sinp) >= 1) pitch_x = (Math.PI / 2) * Math.sign(sinp);
            else pitch_x = Math.asin(sinp);
            // Yaw (Y)
            const yaw_y = Math.atan2(2 * (w * y + z * x), 1 - 2 * (x * x + y * y));
            // Roll (Z)
            const roll_z = Math.atan2(2 * (w * z + x * y), 1 - 2 * (x * x + z * z));
            return [pitch_x * R2D, yaw_y * R2D, roll_z * R2D];
        }
    };

    let models = {};
    let modelOrder = [];

    class OmniGLB {

        constructor() {
            this._boundGetAllLists = this._getAllLists.bind(this);
        }

        _lp(v) {
            if (v instanceof Float32Array || v instanceof Uint16Array || v instanceof Uint8Array || Array.isArray(v)) {
                return Array.from(v).map(x => Math.round(x * 1000000) / 1000000);
            }
            return Math.round(v * 1000000) / 1000000;
        }
        _getBuf(json, bin, accessorIdx) {
            if (accessorIdx === undefined || accessorIdx === null) return null;
            const acc = json.accessors[accessorIdx];
            const bvIdx = acc.bufferView !== undefined ? acc.bufferView : null;
            let offset = acc.byteOffset || 0;
            let stride = 0;
            if (bvIdx !== null) { const bv = json.bufferViews[bvIdx]; offset += (bv.byteOffset || 0); stride = bv.byteStride || 0; }
            const comps = { 'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16 }[acc.type] || 1;
            const count = acc.count * comps;
            const TypedArray = { 5120: Int8Array, 5121: Uint8Array, 5122: Int16Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array }[acc.componentType];
            if (!TypedArray) return null;
            if (stride === 0 || stride === comps * TypedArray.BYTES_PER_ELEMENT) { return new TypedArray(bin, offset, count); }
            else {
                const result = new TypedArray(count);
                const dataView = new DataView(bin);
                for (let i = 0; i < acc.count; i++) {
                    const elOffset = offset + i * stride;
                    for (let j = 0; j < comps; j++) {
                        const byteOffset = elOffset + j * TypedArray.BYTES_PER_ELEMENT;
                        if (acc.componentType === 5126) result[i * comps + j] = dataView.getFloat32(byteOffset, true);
                        else if (acc.componentType === 5123) result[i * comps + j] = dataView.getUint16(byteOffset, true);
                        else if (acc.componentType === 5121) result[i * comps + j] = dataView.getUint8(byteOffset);
                    }
                }
                return result;
            }
        }
        _resolveMaterial(json, matIdx) {
            const defaultMat = {
                name: "None", albedo: [1, 1, 1, 1], albedoTex: "None",
                metallic: 1, roughness: 1, pbrTex: "None", normalTex: "None",
                emissive: [0, 0, 0], emissiveTex: "None"
            };

            if (matIdx === undefined || !json.materials || !json.materials[matIdx]) return defaultMat;
            const matDef = json.materials[matIdx];
            const res = { ...defaultMat, name: matDef.name || `Mat_${matIdx}` };

            // 辅助：从索引获取贴图名称
            const getTexName = (texIndex) => {
                if (texIndex === undefined || !json.textures || !json.textures[texIndex]) return "None";
                const tex = json.textures[texIndex];
                const sourceIdx = tex.source; // GLTF 纹理指向 Image
                if (sourceIdx === undefined || !json.images || !json.images[sourceIdx]) return `Tex_${texIndex}`;
                const img = json.images[sourceIdx];
                // 优先取名字，没有名字取 uri，再没有取序号
                return img.name || (img.uri ? img.uri.split('/').pop() : `Image_${sourceIdx}`);
            };

            // PBR 属性
            if (matDef.pbrMetallicRoughness) {
                const pbr = matDef.pbrMetallicRoughness;
                if (pbr.baseColorFactor) res.albedo = pbr.baseColorFactor;
                if (pbr.baseColorTexture) res.albedoTex = getTexName(pbr.baseColorTexture.index);

                if (pbr.metallicFactor !== undefined) res.metallic = pbr.metallicFactor;
                if (pbr.roughnessFactor !== undefined) res.roughness = pbr.roughnessFactor;
                if (pbr.metallicRoughnessTexture) res.pbrTex = getTexName(pbr.metallicRoughnessTexture.index);
            }

            // 其它纹理
            if (matDef.normalTexture) res.normalTex = getTexName(matDef.normalTexture.index);
            if (matDef.emissiveFactor) res.emissive = matDef.emissiveFactor;
            if (matDef.emissiveTexture) res.emissiveTex = getTexName(matDef.emissiveTexture.index);

            return res;
        }
        _getAllLists() {
            if (!runtime || !runtime.targets) return [' '];
            const lists = new Set();
            runtime.targets.forEach(target => {
                if (target.variables) {
                    for (const id in target.variables) {
                        const v = target.variables[id];
                        if (v.type === 'list') lists.add(v.name);
                    }
                }
            });
            const result = Array.from(lists);
            return result.length > 0 ? result : [' '];
        }
        _setList(listName, data) {
            if (!runtime || !listName) return;

            let variable = null;
            const editingTarget = runtime.getEditingTarget();
            if (editingTarget) {
                variable = editingTarget.lookupVariableByNameAndType(listName, 'list');
            }
            if (!variable) {
                const stage = runtime.getTargetForStage();
                if (stage) variable = stage.lookupVariableByNameAndType(listName, 'list');
            }
            if (!variable) {
                for (const target of runtime.targets) {
                    const found = target.lookupVariableByNameAndType(listName, 'list');
                    if (found && found.name === listName) {
                        variable = found;
                        break;
                    }
                }
            }
            if (variable) {
                if (data === null || data === undefined) {
                    variable.value = [];
                } else if (Array.isArray(data) || (data.buffer && data.buffer instanceof ArrayBuffer)) {
                    variable.value = Array.from(data).map(x => typeof x === 'number' ? Math.round(x * 1000000) / 1000000 : x);
                } else {
                    variable.value = [String(data)];
                }
                variable._monitorUpToDate = false;
            }
        }

        getInfo() {
            return {
                id: 'omniGLB',
                docsURI: 'https://github.com/JoyFul114514/Conf-Engine',
                name: 'Vapor 3D - OmniGLB',
                color1: '#7db4b2',
                blocks: [
                    { blockType: Scratch.BlockType.LABEL, text: "场景&内存" },
                    { opcode: 'getModelCount', blockType: Scratch.BlockType.REPORTER, text: '总模型数' },
                    { opcode: 'parseScene', blockType: Scratch.BlockType.COMMAND, text: '加载 GLB [STR] 命名为 [MID]', arguments: { STR: { type: 'string', defaultValue: '' }, MID: { type: 'string', defaultValue: 'sample' } } },
                    { opcode: 'flushModel', blockType: Scratch.BlockType.COMMAND, text: '释放模型[MI] 顶点缓存', arguments: { MI: { type: 'number', defaultValue: 0 } } },
                    { opcode: 'clearAll', blockType: Scratch.BlockType.COMMAND, text: '释放所有' },

                    { blockType: Scratch.BlockType.LABEL, text: "索引映射" },
                    { opcode: 'getModelID', blockType: Scratch.BlockType.REPORTER, text: '索引 [MI] 的模型 ID', arguments: { MI: { type: 'number', defaultValue: 0 } } },
                    { opcode: 'getModelIndex', blockType: Scratch.BlockType.REPORTER, text: 'ID [MID] 的模型索引', arguments: { MID: { type: 'string', defaultValue: 'sample' } } },
                    { opcode: 'getNodeID', blockType: Scratch.BlockType.REPORTER, text: '模型 [MI] 节点索引 [BI] 的 ID', arguments: { MI: { type: 'number', defaultValue: 0 }, BI: { type: 'number', defaultValue: 0 } } },
                    { opcode: 'getNodeIndex', blockType: Scratch.BlockType.REPORTER, text: '模型 [MI] 节点名 [BN] 的索引', arguments: { MI: { type: 'number', defaultValue: 0 }, BN: { type: 'string', defaultValue: 'sample_node_0' } } },
                    { opcode: 'getMeshID', blockType: Scratch.BlockType.REPORTER, text: '模型 [MI] 网格索引 [MSI] 的 ID', arguments: { MI: { type: 'number', defaultValue: 0 }, MSI: { type: 'number', defaultValue: 0 } } },
                    { opcode: 'getMeshIndex', blockType: Scratch.BlockType.REPORTER, text: '模型 [MI] 中网格名为[MN] 的索引', arguments: { MI: { type: 'number', defaultValue: 0 }, MN: { type: 'string', defaultValue: 'sample_mesh_0' } } },

                    { blockType: Scratch.BlockType.LABEL, text: "节点变换" },
                    { opcode: 'setNodeTransform', blockType: Scratch.BlockType.COMMAND, text: '模型 [MI] 节点 [BI] 设置 TRS [TRS]', arguments: { MI: { type: 'number', defaultValue: 0 }, BI: { type: 'number', defaultValue: 0 }, TRS: { type: 'string', defaultValue: '[0,0,0, 0,0,0,1, 1,1,1]' } } },
                    { opcode: 'getNodeTransform', blockType: Scratch.BlockType.REPORTER, text: '获取模型 [MI] 节点 [BI] 的 TRS', arguments: { MI: { type: 'number', defaultValue: 0 }, BI: { type: 'number', defaultValue: 0 } } },
                    { opcode: 'updateHierarchy', blockType: Scratch.BlockType.COMMAND, text: '更新模型[MI] 的节点变换', arguments: { MI: { type: 'number', defaultValue: 0 } } },
                    { opcode: 'createTRS', blockType: Scratch.BlockType.REPORTER, text: '构造 TRS  位移[PX] [PY] [PZ] 旋转 [RX] [RY] [RZ] 缩放 [SX] [SY] [SZ]', arguments: { PX: { type: 'number', defaultValue: 0 }, PY: { type: 'number', defaultValue: 0 }, PZ: { type: 'number', defaultValue: 0 }, RX: { type: 'number', defaultValue: 0 }, RY: { type: 'number', defaultValue: 0 }, RZ: { type: 'number', defaultValue: 0 }, SX: { type: 'number', defaultValue: 1 }, SY: { type: 'number', defaultValue: 1 }, SZ: { type: 'number', defaultValue: 1 } } }, // 要用欧拉角
                    { opcode: 'decomposeTRS', blockType: Scratch.BlockType.REPORTER, text: '分解 TRS[TRS] 的 [TYPE] [AXIS] 分量', arguments: { TRS: { type: Scratch.ArgumentType.STRING, defaultValue: '[0,0,0,0,0,0,1,1,1,1]' }, TYPE: { type: Scratch.ArgumentType.STRING, menu: 'TRSType' }, AXIS: { type: Scratch.ArgumentType.STRING, menu: 'Axis' } } },
                    { opcode: 'lerpTRS', blockType: Scratch.BlockType.REPORTER, text: '插值 TRS A:[TRSA] B:[TRSB] 进度:[T]', arguments: { TRSA: { type: 'string', defaultValue: '[0,0,0, 0,0,0,1, 1,1,1]' }, TRSB: { type: 'string', defaultValue: '[0,0,0, 0,0,0,1, 1,1,1]' }, T: { type: 'number', defaultValue: 0.5 } } },
                    { opcode: 'addTRS', blockType: Scratch.BlockType.REPORTER, text: '叠加 TRS A:[TRSA] B:[TRSB]', arguments: { TRSA: { type: 'string', defaultValue: '[0,0,0, 0,0,0,1, 1,1,1]' }, TRSB: { type: 'string', defaultValue: '[0,0,0, 0,0,0,1, 1,1,1]' } } },

                    { blockType: Scratch.BlockType.LABEL, text: "节点信息" },
                    { opcode: 'getNodeCount', blockType: Scratch.BlockType.REPORTER, text: '模型 [MI] 的节点总数', arguments: { MI: { type: 'number', defaultValue: 0 } } },
                    { opcode: 'getNodeInfo', blockType: Scratch.BlockType.REPORTER, text: '获取模型 [MI] 节点 [BI] 的 [INFO]', arguments: { MI: { type: 'number', defaultValue: 0 }, BI: { type: 'number', defaultValue: 0 }, INFO: { type: 'string', menu: 'nodeMenu' } } },

                    { blockType: Scratch.BlockType.LABEL, text: "网格数据" },
                    { opcode: 'getMeshCount', blockType: Scratch.BlockType.REPORTER, text: '模型 [MI] 的网格数量', arguments: { MI: { type: 'number', defaultValue: 0 } } },
                    { opcode: 'getMeshInfo', blockType: Scratch.BlockType.REPORTER, text: '获取模型 [MI] 网格[MSI] 的 [INFO]', arguments: { MI: { type: 'number', defaultValue: 0 }, MSI: { type: 'number', defaultValue: 0 }, INFO: { type: 'string', menu: 'meshMenu' } } },
                    {opcode: 'getMaterialInfo', blockType: Scratch.BlockType.REPORTER, text: '获取模型 [MI] 网格 [MSI] 材质 [PROP]', arguments: { MI: { type: 'number', defaultValue: 0 }, MSI: { type: 'number', defaultValue: 0 }, PROP: { type: 'string', menu: 'matPropMenu' } } },
                    { opcode: 'getMeshInfoToList', blockType: Scratch.BlockType.COMMAND, text: '获取模型 [MI] 网格 [MSI] 的 [INFO] 存入列表 [LIST]', arguments: { MI: { type: 'number', defaultValue: 0 }, MSI: { type: 'number', defaultValue: 0 }, INFO: { type: 'string', menu: 'meshMenu' }, LIST: { type: 'string', menu: 'listMenu' } } },
                    { opcode: 'getSkinningMatrices', blockType: Scratch.BlockType.REPORTER, text: '获取模型 [MI] 网格 [MSI] 的 [TYPE] 绑定矩阵', arguments: { MI: { type: 'number', defaultValue: 0 }, MSI: { type: 'number', defaultValue: 0 }, TYPE: { type: 'string', menu: 'poseMenu', defaultValue: 'current' } } },
                    { opcode: 'getSkinningMatricesToList', blockType: Scratch.BlockType.COMMAND, text: '获取模型 [MI] 网格 [MSI] 的 [TYPE] 绑定矩阵存入列表 [LIST]', arguments: { MI: { type: 'number', defaultValue: 0 }, MSI: { type: 'number', defaultValue: 0 }, TYPE: { type: 'string', menu: 'poseMenu', defaultValue: 'current' }, LIST: { type: 'string', menu: 'listMenu' } } },

                    { blockType: Scratch.BlockType.LABEL, text: "动画控制" },
                    { opcode: 'activateAnimation', blockType: Scratch.BlockType.COMMAND, text: '模型 [MI] 激活动画 [NAME]', arguments: { MI: { type: 'number', defaultValue: 0 }, NAME: { type: 'string', defaultValue: 'Run' } } },
                    { opcode: 'setAnimationTime', blockType: Scratch.BlockType.COMMAND, text: '模型 [MI] 设置激活动画时刻 [TIME]', arguments: { MI: { type: 'number', defaultValue: 0 }, TIME: { type: 'number', defaultValue: 0 } } },
                    { opcode: 'getAnimationDuration', blockType: Scratch.BlockType.REPORTER, text: '获取模型 [MI] 激活动画 [NAME] 的时长', arguments: { MI: { type: 'number', defaultValue: 0 }, NAME: { type: 'string', defaultValue: '' } } },
                    { opcode: 'hasAnimationTrack', blockType: Scratch.BlockType.BOOLEAN, text: '模型 [MI] 节点 [BI] 当前动画有轨道？', arguments: { MI: { type: 'number', defaultValue: 0 }, BI: { type: 'number', defaultValue: 0 } } },
                    { opcode: 'getActiveAnimInfo', blockType: Scratch.BlockType.REPORTER, text: '获取模型 [MI] 节点 [BI] 激活动画的 TRS', arguments: { MI: { type: 'number', defaultValue: 0 }, BI: { type: 'number', defaultValue: 0 } } },

                    { blockType: Scratch.BlockType.LABEL, text: "高级" },
                    { opcode: 'matrixToEulerDegrees', blockType: Scratch.BlockType.REPORTER, text: '矩阵转欧拉角 [M]', arguments: { M: { type: 'string', defaultValue: '[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]' } } },
                    { opcode: 'setNodePose', blockType: Scratch.BlockType.COMMAND, text: '设置节点 [BI] 矩阵 [MAT]', arguments: { MI: { type: 'number', defaultValue: 0 }, BI: { type: 'number', defaultValue: 0 }, MAT: { type: 'string', defaultValue: '[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]' } } }
                ],
                menus: {
                    nodeMenu: { items: ['node_id', 'parent_index', 'current_matrix', 'current_TRS', 'original_TRS'] },
                    TRSType: { acceptReporters: true, items: [{ text: '位移', value: 'T' }, { text: '旋转', value: 'R' }, { text: '缩放', value: 'S' }] },
                    Axis: { acceptReporters: true, items: ['X', 'Y', 'Z'] },
                    meshMenu: { items: ['name', 'position', 'normal', 'uv', 'node_indices', 'node_weights'] },
                    poseMenu: { items: ['current', 'original'] },
                    listMenu: { acceptReporters: true, items: '_boundGetAllLists' },
                    matPropMenu: { items: [{ text: 'albedo', value: 'albedo' }, { text: 'metallic', value: 'metallic' }, { text: 'roughness', value: 'roughness' }, { text: 'pbrTex', value: 'pbrTex' },{ text: 'normal', value: 'normal' },{ text: 'emissive', value: 'emissive' } ] } }
            };
        }
        parseScene(args) {
            try {
                const mid = String(args.MID);
                const b64 = args.STR.split(',').pop();
                const binStr = atob(b64);
                const bytes = new Uint8Array(binStr.length);
                for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
                const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
                if (dv.getUint32(0, true) !== 0x46546C67) return;

                let offset = 12, json = null, bin = null;
                while (offset < bytes.length) {
                    const chunkLen = dv.getUint32(offset, true);
                    const chunkType = dv.getUint32(offset + 4, true);
                    if (chunkType === 0x4E4F534A) json = JSON.parse(new TextDecoder().decode(bytes.subarray(offset + 8, offset + 8 + chunkLen)));
                    else if (chunkType === 0x004E4942) bin = bytes.buffer.slice(bytes.byteOffset + offset + 8, bytes.byteOffset + offset + 8 + chunkLen);
                    offset += 8 + chunkLen;
                }

                const nodes = (json.nodes || []).map((n, i) => {
                    let defT = n.translation || [0, 0, 0];
                    let defR = n.rotation || [0, 0, 0, 1];
                    let defS = n.scale || [1, 1, 1];

                    if (n.matrix) {
                        const d = m4.decompose(new Float32Array(n.matrix));
                        defT = d.t; defR = d.r; defS = d.s;
                    }

                    const bindLocal = m4.fromRotationTranslation(defR, defT, defS);

                    return {
                        name: n.name || `node_${i}`,
                        parent: -1,
                        defT, defR, defS,
                        bindLocal,
                        // TRS Cache
                        rtT: Float32Array.from(defT),
                        rtR: Float32Array.from(defR),
                        rtS: Float32Array.from(defS),
                        // Matrix Cache
                        bindWorld: m4.identity(),
                        invBindWorld: m4.identity(),
                        skinMatrix: m4.identity(),
                        world: m4.identity(),

                        meshIdx: n.mesh,
                        skinIdx: n.skin
                    };
                });

                (json.nodes || []).forEach((n, i) => { if (n.children) n.children.forEach(c => { if (nodes[c]) nodes[c].parent = i; }); });

                let calcOrder = [];
                let visited = new Uint8Array(nodes.length);
                const visitNode = (idx) => { if (visited[idx]) return; visited[idx] = 1; if (nodes[idx].parent !== -1) visitNode(nodes[idx].parent); calcOrder.push(idx); };
                for (let i = 0; i < nodes.length; i++) visitNode(i);

                calcOrder.forEach(idx => {
                    const n = nodes[idx];
                    if (n.parent === -1) n.bindWorld.set(n.bindLocal);
                    else n.bindWorld.set(m4.multiply(nodes[n.parent].bindWorld, n.bindLocal));
                    n.world.set(n.bindWorld);
                    const inv = inverse(n.bindWorld);
                    if (inv) n.invBindWorld.set(inv);
                });

                const geoLib = [];
                (json.meshes || []).forEach((m, mIdx) => {
                    const primitives = [];
                    (m.primitives || []).forEach((prim, pIdx) => {
                        const idxs = this._getBuf(json, bin, prim.indices);
                        const rP = this._getBuf(json, bin, prim.attributes.POSITION);
                        const rN = this._getBuf(json, bin, prim.attributes.NORMAL);
                        const rU = this._getBuf(json, bin, prim.attributes.TEXCOORD_0);
                        const rI = this._getBuf(json, bin, prim.attributes.JOINTS_0);
                        const rW = this._getBuf(json, bin, prim.attributes.WEIGHTS_0);
                        const matData = this._resolveMaterial(json, prim.material);

                        let p = [], n = [], u = [], rawIndices = [], rawWeights = [];

                        // 非常好优化：记录当前网格真正用到的骨骼索引，不然每个网格都上传完整的矩阵给你uniform炸开
                        let usedJointIndices = [];
                        let jointMap = new Map();

                        const processVertex = (idx) => {
                            if (rP) p.push(rP[idx * 3], rP[idx * 3 + 1], rP[idx * 3 + 2]);
                            if (rN) n.push(rN[idx * 3], rN[idx * 3 + 1], rN[idx * 3 + 2]); // <--- 新增法线数据压入
                            if (rU) u.push(rU[idx * 2], rU[idx * 2 + 1]);
                            if (rI && rW) {
                                // 提取该顶点的 4 根骨骼及权重
                                let w0 = rW[idx * 4], w1 = rW[idx * 4 + 1], w2 = rW[idx * 4 + 2], w3 = rW[idx * 4 + 3];
                                let j0 = rI[idx * 4], j1 = rI[idx * 4 + 1], j2 = rI[idx * 4 + 2], j3 = rI[idx * 4 + 3];

                                let sum = w0 + w1 + w2 + w3;

                                const addJoint = (joint, weight, isFirst) => {
                                    // 归一化权重。如果所有权重都是0，默认让第一根骨骼权重为1，防止顶点原点塌陷，也支持刚体
                                    let normWeight = sum > 0 ? weight / sum : (isFirst ? 1 : 0);
                                    if (normWeight > 0) {
                                        let mapped = jointMap.get(joint);
                                        if (mapped === undefined) {
                                            mapped = usedJointIndices.length;
                                            jointMap.set(joint, mapped);
                                            usedJointIndices.push(joint);
                                        }
                                        rawIndices.push(mapped);
                                    } else {
                                        rawIndices.push(-1); // 零权重骨骼占位符
                                    }
                                    rawWeights.push(normWeight);
                                };

                                addJoint(j0, w0, true);
                                addJoint(j1, w1, false);
                                addJoint(j2, w2, false);
                                addJoint(j3, w3, false);
                            } else {
                                rawIndices.push(0, 0, 0, 0);
                                rawWeights.push(1, 0, 0, 0);
                            }
                        };

                        if (idxs) for (let i = 0; i < idxs.length; i++) processVertex(idxs[i]);
                        else if (rP) for (let i = 0; i < rP.length / 3; i++) processVertex(i);

                        // 修复 0 权重的占位符，指向当前网格有效骨骼的第一个，现在支持刚体了哈哈
                        if (rI && rW) {
                            if (usedJointIndices.length === 0) usedJointIndices.push(0);
                            for (let i = 0; i < rawIndices.length; i++) {
                                if (rawIndices[i] === -1) rawIndices[i] = 0;
                            }
                        }

                        primitives.push({
                            name: m.name || `Mesh_${mIdx}_Prim_${pIdx}`,
                            mat: matData, // 这里存的对象
                            p, n, u, rawIndices, rawWeights,
                            isSkinnedData: !!(rI && rW),
                            usedJointIndices
                        });
                    });
                    geoLib.push(primitives);
                });

                const renderables = [];
                nodes.forEach((node, nIdx) => {
                    if (node.meshIdx !== undefined && geoLib[node.meshIdx]) {
                        const primitives = geoLib[node.meshIdx];
                        primitives.forEach((geo, pIdx) => {
                            let handles = [], finalIndices = [];
                            if (node.skinIdx !== undefined && json.skins && json.skins[node.skinIdx]) {
                                const skinJoints = json.skins[node.skinIdx].joints;
                                // 非常好优化：将网格局部收集到的索引，还原映射到全局 skin 骨骼
                                handles = geo.usedJointIndices.map(jIdx => skinJoints[jIdx]);
                                finalIndices = geo.rawIndices; // 此时已经是映射完毕的局部索引用以匹配 handles
                            } else {
                                handles = [nIdx];
                                finalIndices = geo.rawIndices; // 非蒙皮网格，均为0
                            }
                            renderables.push({
                                name: `${node.name}_${geo.name}`,
                                mat: geo.mat,
                                tex: geo.tex,
                                geo: { position: geo.p, normal: geo.n, uv: geo.u, node_indices: finalIndices, node_weights: geo.rawWeights },
                                handles: handles,
                                nodeIndex: nIdx,
                                isSkinned: node.skinIdx !== undefined
                            });
                        });
                    }
                });

                const animations = {};
                if (json.animations) {
                    json.animations.forEach((anim, aIdx) => {
                        const nodeTracksMap = {};
                        anim.channels.forEach(ch => {
                            if (!nodeTracksMap[ch.target.node]) nodeTracksMap[ch.target.node] = { t: null, r: null, s: null };
                            const sampler = anim.samplers[ch.sampler];
                            const times = this._getBuf(json, bin, sampler.input), values = this._getBuf(json, bin, sampler.output);
                            if (times && values) {
                                if (ch.target.path === 'translation') nodeTracksMap[ch.target.node].t = { times, values };
                                else if (ch.target.path === 'rotation') nodeTracksMap[ch.target.node].r = { times, values };
                                else if (ch.target.path === 'scale') nodeTracksMap[ch.target.node].s = { times, values };
                            }
                        });
                        const bakedTracks = {};
                        for (let nId in nodeTracksMap) {
                            const raw = nodeTracksMap[nId];
                            const n = nodes[nId];
                            const allTimes = Array.from(new Set([...(raw.t ? raw.t.times : []), ...(raw.r ? raw.r.times : []), ...(raw.s ? raw.s.times : [])])).sort((a, b) => a - b);
                            if (allTimes.length === 0) continue;
                            const sample = (track, time, def, comps) => {
                                if (!track) return def;
                                let i = 0; while (i < track.times.length - 2 && time >= track.times[i + 1]) i++;
                                let alpha = (track.times[i + 1] > track.times[i]) ? (time - track.times[i]) / (track.times[i + 1] - track.times[i]) : 0;
                                if (comps === 4) return m4.slerp(track.values.subarray(i * 4, i * 4 + 4), track.values.subarray((i + 1) * 4, (i + 1) * 4 + 4), alpha);
                                return m4.lerp(track.values.subarray(i * 3, i * 3 + 3), track.values.subarray((i + 1) * 3, (i + 1) * 3 + 3), alpha);
                            };
                            const absT = new Float32Array(allTimes.length * 3), absR = new Float32Array(allTimes.length * 4), absS = new Float32Array(allTimes.length * 3);
                            allTimes.forEach((time, idx) => {
                                absT.set(sample(raw.t, time, n.defT, 3), idx * 3);
                                absR.set(sample(raw.r, time, n.defR, 4), idx * 4);
                                absS.set(sample(raw.s, time, n.defS, 3), idx * 3);
                            });
                            bakedTracks[nId] = { times: new Float32Array(allTimes), t: absT, r: absR, s: absS };
                        }
                        let duration = 0; for (let k in bakedTracks) duration = Math.max(duration, bakedTracks[k].times[bakedTracks[k].times.length - 1]);
                        animations[anim.name || `Anim_${aIdx}`] = { bakedTracks, duration };
                    });
                }
                models[mid] = { renderables, nodes, calcOrder, animations, activeAnim: "", activeTime: 0 };
                if (!modelOrder.includes(mid)) modelOrder.push(mid);
            } catch (e) { console.error("GLB 加载失败:", e); }
        }

        createTRS(args) {
            const px = Number(args.PX) || 0, py = Number(args.PY) || 0, pz = Number(args.PZ) || 0;
            const rx = Number(args.RX) || 0, ry = Number(args.RY) || 0, rz = Number(args.RZ) || 0;
            const sx = args.SX !== undefined ? Number(args.SX) : 1;
            const sy = args.SY !== undefined ? Number(args.SY) : 1;
            const sz = args.SZ !== undefined ? Number(args.SZ) : 1;
            // ZXY
            const q = m4.eulerToQuat(rx * D2R, ry * D2R, rz * D2R);
            return JSON.stringify(this._lp([px, py, pz, q[0], q[1], q[2], q[3], sx, sy, sz]));
        }
        decomposeTRS(args) {
            try {
                let data;
                if (typeof args.TRS === 'string') {
                    data = JSON.parse(args.TRS);
                } else {
                    data = args.TRS; // 如果已经是数组，直接赋值，但是scratch只能传string，留后面内嵌simple用
                }
                if (!Array.isArray(data) || data.length < 10) return 0;
                const type = args.TYPE;
                const axis = args.AXIS;
                const axisIdx = axis === 'X' ? 0 : (axis === 'Y' ? 1 : 2);
                if (type === 'T') return Number(data[axisIdx]) || 0;
                if (type === 'S') return Number(data[7 + axisIdx]) || 0;
                if (type === 'R') {
                    const quat = [data[3], data[4], data[5], data[6]];
                    const eulerResult = m4.quatToEuler(quat);
                    let euler;
                    euler = eulerResult;
                    return Number(euler[axisIdx]) || 0;
                }
            } catch (e) {
                console.error("OmniGLB decomposeTRS Error:", e);
                return 0;
            }
            return 0;
        }
        lerpTRS(args) {
            try {
                const trsa = JSON.parse(args.TRSA);
                const trsb = JSON.parse(args.TRSB);
                let t = Number(args.T) || 0;
                t = Math.max(0, Math.min(1, t));

                if (Array.isArray(trsa) && Array.isArray(trsb) && trsa.length >= 10 && trsb.length >= 10) {
                    const pa = trsa.slice(0, 3), pb = trsb.slice(0, 3);
                    const qa = trsa.slice(3, 7), qb = trsb.slice(3, 7);
                    const sa = trsa.slice(7, 10), sb = trsb.slice(7, 10);

                    // P, S 线性，Q 球面线性
                    const p = m4.lerp(pa, pb, t);
                    const q = m4.slerp(qa, qb, t);
                    const s = m4.lerp(sa, sb, t);

                    return JSON.stringify(this._lp([...p, ...q, ...s]));
                }
            } catch (e) { }
            return "[0,0,0, 0,0,0,1, 1,1,1]";
        }
        addTRS(args) {
            try {
                const a = JSON.parse(args.TRSA);
                const b = JSON.parse(args.TRSB);

                if (Array.isArray(a) && Array.isArray(b) && a.length >= 10 && b.length >= 10) {
                    // 位移相加
                    const px = a[0] + b[0];
                    const py = a[1] + b[1];
                    const pz = a[2] + b[2];
                    // 四元数乘法
                    const x1 = a[3], y1 = a[4], z1 = a[5], w1 = a[6];
                    const x2 = b[3], y2 = b[4], z2 = b[5], w2 = b[6];

                    const rx = x1 * w2 + w1 * x2 + y1 * z2 - z1 * y2;
                    const ry = y1 * w2 + w1 * y2 + z1 * x2 - x1 * z2;
                    const rz = z1 * w2 + w1 * z2 + x1 * y2 - y1 * x2;
                    const rw = w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2;
                    // 缩放相乘
                    const sx = a[7] * b[7];
                    const sy = a[8] * b[8];
                    const sz = a[9] * b[9];

                    return JSON.stringify(this._lp([px, py, pz, rx, ry, rz, rw, sx, sy, sz]));
                }
            } catch (e) {
                console.error("OmniGLB addTRS Error:", e);
            }
            return args.TRSA;
        }

        // ---------------------------------Mapping--------------------------------

        getModelID(args) { return modelOrder[Math.floor(args.MI)] || ""; }
        getModelIndex(args) { return modelOrder.indexOf(String(args.MID)); }

        getNodeID(args) {
            const m = models[modelOrder[Math.floor(args.MI)]];
            const nIdx = Math.floor(args.BI);
            return (m && m.nodes && m.nodes[nIdx]) ? m.nodes[nIdx].name : "";
        }
        getNodeIndex(args) {
            const m = models[modelOrder[Math.floor(args.MI)]];
            if (!m || !m.nodes) return -1;
            const name = String(args.BN);
            return m.nodes.findIndex(n => n.name === name);
        }

        getMeshID(args) {
            const m = models[modelOrder[Math.floor(args.MI)]];
            const msi = Math.floor(args.MSI);
            return (m && m.renderables && m.renderables[msi]) ? m.renderables[msi].name : "";
        }
        getMeshIndex(args) { const m = models[modelOrder[Math.floor(args.MI)]]; return m ? m.renderables.findIndex(r => r.name === String(args.MN)) : -1; }

        // ---------------------------------Model--------------------------------

        getModelCount() { return modelOrder.length; }
        flushModel(args) { const m = models[modelOrder[Math.floor(args.MI)]]; if (m) m.renderables.forEach(r => { r.geo = null; }); }
        clearAll() { models = {}; modelOrder = []; }

        // ---------------------------------Mesh---------------------------------

        getMeshInfo(args) {
            const m = models[modelOrder[Math.floor(args.MI)]];
            if (!m || !m.renderables[args.MSI]) return "";
            const r = m.renderables[args.MSI];
            if (args.INFO === 'name') return r.name;
            let infoKey = args.INFO;
            if (infoKey === 'bone_indices') infoKey = 'node_indices';
            if (infoKey === 'bone_weights') infoKey = 'node_weights';
            const data = r.geo ? r.geo[infoKey] : null;
            if (Array.isArray(data) || data instanceof Float32Array) return JSON.stringify(this._lp(data));
            return data || "[]";
        }
        getMaterialInfo(args) {
            const m = models[modelOrder[Math.floor(args.MI)]];
            if (!m || !m.renderables[args.MSI]) return "";
            const mat = m.renderables[args.MSI].mat;
            switch (args.PROP) {
                case 'albedo': return mat.albedoTex !== "None" ? mat.albedoTex : JSON.stringify(this._lp(mat.albedo));
                case 'metallic': return mat.pbrTex !== "None" ? mat.pbrTex : mat.metallic;
                case 'roughness': return mat.pbrTex !== "None" ? mat.pbrTex : mat.roughness;
                case 'pbrTex': return mat.pbrTex;
                case 'normal': return mat.normalTex;
                case 'emissive': return mat.emissiveTex !== "None" ? mat.emissiveTex : JSON.stringify(this._lp(mat.emissive));
                default: return "";
            }
        }
        getMeshCount(args) { const m = models[modelOrder[Math.floor(args.MI)]]; return m ? m.renderables.length : 0; }
        getSkinningMatrices(args) {
            const m = models[modelOrder[Math.floor(args.MI)]];
            if (!m || !m.renderables[args.MSI]) return "[]";
            const r = m.renderables[args.MSI];
            let out = [];
            // 此处遍历的 handles 已经是精简后的该网格专属骨骼列表
            r.handles.forEach(idx => {
                const node = m.nodes[idx];
                let mat;
                if (r.isSkinned) mat = (args.TYPE === '初始' || args.TYPE === 'original') ? m4.multiply(node.bindWorld, node.invBindWorld) : node.skinMatrix;
                else mat = (args.TYPE === '初始' || args.TYPE === 'original') ? node.bindWorld : node.world;
                out.push(...Array.from(mat));
            });
            return JSON.stringify(this._lp(out));
        }
        getMeshInfoToList(args) {
            const m = models[modelOrder[Math.floor(args.MI)]];
            if (!m || !m.renderables || !m.renderables[Math.floor(args.MSI)]) return;
            const r = m.renderables[Math.floor(args.MSI)];

            let infoKey = args.INFO;
            if (infoKey === 'bone_indices') infoKey = 'node_indices';
            if (infoKey === 'bone_weights') infoKey = 'node_weights';

            let data = [];
            if (infoKey === 'name') data = r.name;
            else if (infoKey === 'material_name') data = r.mat;
            else if (infoKey === 'texture_name') data = r.tex;
            else if (r.geo && r.geo[infoKey]) {
                data = r.geo[infoKey];
            }

            this._setList(args.LIST, data);
        }

        getSkinningMatricesToList(args) {
            const m = models[modelOrder[Math.floor(args.MI)]];
            if (!m || !m.renderables || !m.renderables[Math.floor(args.MSI)]) return;
            const r = m.renderables[Math.floor(args.MSI)];

            const out = new Float32Array(r.handles.length * 16);
            const isOriginal = (args.TYPE === '初始' || args.TYPE === 'original');

            r.handles.forEach((idx, i) => {
                const node = m.nodes[idx];
                if (!node) return;
                let mat = r.isSkinned ?
                    (isOriginal ? m4.multiply(node.bindWorld, node.invBindWorld) : node.skinMatrix) :
                    (isOriginal ? node.bindWorld : node.world);
                out.set(mat, i * 16);
            });

            this._setList(args.LIST, out);
        }

        // -----------------------------Node--------------------------------

        getNodeCount(args) { const m = models[modelOrder[Math.floor(args.MI)]]; return m && m.nodes ? m.nodes.length : 0; }
        getNodeInfo(args) {
            const m = models[modelOrder[Math.floor(args.MI)]];
            const nIdx = Math.floor(args.BI);
            if (!m || !m.nodes || nIdx < 0 || nIdx >= m.nodes.length) return "";
            const n = m.nodes[nIdx];
            switch (args.INFO) {
                case 'node_id': return n.name;
                case 'parent_index': return n.parent;
                case 'current_matrix': return JSON.stringify(this._lp(n.world));
                case 'original_TRS': {
                    const d = m4.decompose(n.bindWorld);
                    return JSON.stringify(this._lp([...d.t, ...d.r, ...d.s]));
                }
                case 'current_TRS':
                    const d = m4.decompose(n.world);
                    return JSON.stringify(this._lp([...d.t, ...d.r, ...d.s]));
                default: return "";
            }
        }
        setNodeTransform(args) {
            const m = models[modelOrder[Math.floor(args.MI)]];
            const n = m ? m.nodes[Math.floor(args.BI)] : null;
            if (n) {
                try {
                    const trs = JSON.parse(args.TRS);
                    if (Array.isArray(trs) && trs.length >= 10) {
                        n.rtT.set([trs[0], trs[1], trs[2]]);
                        n.rtR.set([trs[3], trs[4], trs[5], trs[6]]);
                        n.rtS.set([trs[7], trs[8], trs[9]]);
                    }
                } catch (e) { }
            }
        }
        updateHierarchy(args) {
            const m = models[modelOrder[Math.floor(args.MI)]];
            if (!m) return;
            const localMat = new Float32Array(16);
            m.calcOrder.forEach(idx => {
                const n = m.nodes[idx];
                m4.fromRotationTranslation(n.rtR, n.rtT, n.rtS, localMat);
                if (n.parent === -1) n.world.set(localMat);
                else n.world.set(m4.multiply(m.nodes[n.parent].world, localMat));
                n.skinMatrix.set(m4.multiply(n.world, n.invBindWorld));
            });
        }
        getNodeTransform(args) {
            const m = models[modelOrder[Math.floor(args.MI)]];
            const n = m ? m.nodes[Math.floor(args.BI)] : null;
            if (!n) return "[0,0,0, 0,0,0,1, 1,1,1]";
            return JSON.stringify(this._lp([...n.rtT, ...n.rtR, ...n.rtS]));
        }

        // ----------------------------Animation-----------------------------

        activateAnimation(args) { const m = models[modelOrder[Math.floor(args.MI)]]; if (m) m.activeAnim = String(args.NAME); }
        setAnimationTime(args) { const m = models[modelOrder[Math.floor(args.MI)]]; if (m) m.activeTime = Number(args.TIME); }
        getAnimationDuration(args) {
            const m = models[modelOrder[Math.floor(args.MI)]];
            if (!m) return 0;
            // 如果没填名字就获取当前激活动画
            const animName = args.NAME || m.activeAnim;
            const anim = m.animations[animName];
            return anim ? anim.duration : 0;
        }
        hasAnimationTrack(args) {
            const m = models[modelOrder[Math.floor(args.MI)]];
            const nIdx = Math.floor(args.BI);
            if (!m || !m.activeAnim || !m.animations[m.activeAnim]) return false;

            const track = m.animations[m.activeAnim].bakedTracks[nIdx];
            // 只有当 track 存在，且内部至少有一个轨道数据不为 null 时，才有动画
            return !!(track && (track.t || track.r || track.s));
        }
        getActiveAnimInfo(args) {
            const m = models[modelOrder[Math.floor(args.MI)]];
            const nIdx = Math.floor(args.BI);
            if (!m || !m.activeAnim || !m.animations[m.activeAnim] || !m.animations[m.activeAnim].bakedTracks[nIdx]) {
                const n = (m && m.nodes[nIdx]) ? m.nodes[nIdx] : null;
                if (!n) return "[0,0,0, 0,0,0,1, 1,1,1]";
                return JSON.stringify(this._lp([...n.defT, ...n.defR, ...n.defS]));
            }

            const anim = m.animations[m.activeAnim];
            const track = anim.bakedTracks[nIdx];
            const time = m.activeTime % (anim.duration || 1);

            let i = 0;
            while (i < track.times.length - 2 && time >= track.times[i + 1]) i++;
            let alpha = (track.times[i + 1] > track.times[i]) ? (time - track.times[i]) / (track.times[i + 1] - track.times[i]) : 0;

            const t = m4.lerp(track.t.subarray(i * 3, i * 3 + 3), track.t.subarray((i + 1) * 3, (i + 1) * 3 + 3), alpha);
            const r = m4.slerp(track.r.subarray(i * 4, i * 4 + 4), track.r.subarray((i + 1) * 4, (i + 1) * 4 + 4), alpha);
            let s = [1, 1, 1];
            if (track.s) s = m4.lerp(track.s.subarray(i * 3, i * 3 + 3), track.s.subarray((i + 1) * 3, (i + 1) * 3 + 3), alpha);

            return JSON.stringify(this._lp([...t, ...r, ...s]));
        }

        // ---------------------------DeBug---------------------------

        setNodePose(args) {
            const m = models[modelOrder[Math.floor(args.MI)]];
            const n = m ? m.nodes[Math.floor(args.BI)] : null;
            if (n) {
                try {
                    const matData = JSON.parse(args.MAT);
                    if (Array.isArray(matData) && matData.length === 16) {
                        const d = m4.decompose(new Float32Array(matData));
                        n.rtT.set(d.t); n.rtR.set(d.r); n.rtS.set(d.s);
                    }
                } catch (e) { }
            }
        }
        matrixToEulerDegrees(args) {
            const m = (typeof args.M === 'string' ? JSON.parse(args.M) : args.M) || [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
            if (m.length < 16) return "[0,0,0]";
            const { r } = m4.decompose(new Float32Array(m));
            return JSON.stringify(this._lp(m4.quatToEuler(r)));
        }

    }
    Scratch.extensions.register(new OmniGLB());
})(Scratch);