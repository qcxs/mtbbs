const BbcodeToHtml = {
    template: `
    <div class="page-converter">
      <el-card class="converter-card" shadow="never">
        <div class="converter-grid">
          <div class="converter-panel">
            <div class="panel-label">
              <div class="panel-label-left">
                <span class="label-dot" style="background:#4361ee"></span>
                <span>BBCode</span>
              </div>
              <div class="panel-label-right">
                <el-button
                  text
                  size="small"
                  @click="triggerFileInput"
                  class="copy-btn"
                >
                  上传
                </el-button>
                <input
                  ref="fileInput"
                  type="file"
                  accept=".txt"
                  style="display:none"
                  @change="handleFileUpload"
                />
              </div>
            </div>
            <el-input
              v-model="bbcodeText"
              type="textarea"
              :rows="18"
              placeholder="在此输入 BBCode 文本..."
              @input="convert"
              :maxlength="20000"
              show-word-limit
              class="converter-input"
            />
          </div>

          <div class="converter-panel">
            <div class="panel-label">
              <div class="panel-label-left">
                <span class="label-dot" style="background:#4361ee"></span>
                <span>预览效果</span>
              </div>
              <div class="panel-label-right">
                <el-button
                  text
                  size="small"
                  @click="convert"
                  title="刷新预览"
                  class="copy-btn"
                >
                  刷新预览
                </el-button>
                <el-button
                  text
                  size="small"
                  @click="copyBbcode"
                  class="copy-btn"
                >
                  复制
                </el-button>
              </div>
            </div>
            <div class="preview-wrapper" ref="previewRef"></div>
          </div>
        </div>
      </el-card>
    </div>
    `,

    data() {
        return {
            bbcodeText: '',
            _container: null
        };
    },

    mounted() {
        this._container = this.$refs.previewRef;
        // 监听全局拖放事件
        window.addEventListener('file-dropped', this.handleGlobalFileDrop);
    },

    beforeUnmount() {
        // 移除全局拖放事件监听
        window.removeEventListener('file-dropped', this.handleGlobalFileDrop);
    },

    methods: {
        convert() {
            if (!this._container) return;
            if (!this.bbcodeText) {
                const shadowRoot = this._container.shadowRoot;
                if (shadowRoot) {
                    const el = shadowRoot.querySelector('#preview-content');
                    if (el) {
                        el.innerHTML = '<div style="color:#bbb;text-align:center;padding:80px 0;font-size:14px">预览效果将显示在这里...</div>';
                    }
                }
                return;
            }
            if (window.BBCode2Html) {
                const html = BBCode2Html.replaceText(this.bbcodeText);
                BBCode2Html.renderShadowDOM(this._container, html);
            }
        },

        copyBbcode() {
            if (!this.bbcodeText) return;
            navigator.clipboard.writeText(this.bbcodeText).then(() => {
                this.$message.success('已复制到剪贴板');
            }).catch(() => {
                this.$message.error('复制失败');
            });
        },

        triggerFileInput() {
            this.$refs.fileInput.click();
        },

        handleFileUpload(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target.result;
                this.handleFileDrop(content);
            };
            reader.readAsText(file, 'utf-8');
            
            // 重置文件输入，以便可以再次选择相同文件
            event.target.value = '';
        },

        handleFileDrop(content) {
            // 处理拖放的文件内容
            if (content.length > 20000) {
                this.$message.error('文件内容超过20000字符限制，请上传更小的文件');
                return;
            }
            this.bbcodeText = content;
            this.convert();
        },

        handleGlobalFileDrop(event) {
            // 处理全局拖放事件
            const content = event.detail?.content;
            if (content) {
                this.handleFileDrop(content);
            }
        }
    },

    watch: {
        bbcodeText() {
            this.convert();
        }
    }
};
