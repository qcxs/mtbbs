const MdToBbcode = {
    template: `
    <div class="page-converter">
      <el-card class="converter-card" shadow="never">
        <div class="converter-grid">
          <div class="converter-panel">
            <div class="panel-label">
              <div class="panel-label-left">
                <span class="label-dot" style="background:#4361ee"></span>
                <span>Markdown</span>
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
                  accept=".md,.txt"
                  style="display:none"
                  @change="handleFileUpload"
                />
              </div>
            </div>
            <el-input
              v-model="mdText"
              type="textarea"
              :rows="18"
              placeholder="在此输入 Markdown 文本..."
              @input="handleInput"
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
                  @click="refreshPreview"
                  title="刷新预览"
                  class="copy-btn"
                >
                  刷新预览
                </el-button>
                <el-button
                  text
                  size="small"
                  @click="showBbcodeDialog"
                  class="copy-btn"
                >
                  复制BBCode
                </el-button>
              </div>
            </div>
            <div ref="previewContainer" class="preview-wrapper"></div>
          </div>
        </div>
      </el-card>
    </div>
    
    <!-- BBCode 复制弹窗 -->
    <el-dialog
      title="BBCode 代码"
      v-model="dialogVisible"
      width="80%"
      append-to-body
    >
      <el-input
        v-model="bbcodeText"
        type="textarea"
        :rows="15"
        readonly
        class="bbcode-dialog-input"
      />
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="copyBbcodeFromDialog">复制</el-button>
        </div>
      </template>
    </el-dialog>
    `,

    data() {
        return {
            mdText: '',
            bbcodeText: '',
            _previewContainer: null,
            dialogVisible: false,
            convertTimeout: null
        };
    },

    mounted() {
        this._previewContainer = this.$refs.previewContainer;
        // 初始转换
        if (this.mdText) {
            this.convert();
        }
        // 监听全局拖放事件
        window.addEventListener('file-dropped', this.handleGlobalFileDrop);
    },

    beforeUnmount() {
        // 移除全局拖放事件监听
        window.removeEventListener('file-dropped', this.handleGlobalFileDrop);
    },



    methods: {
        handleInput() {
            // 使用300ms防抖避免频繁转换
            clearTimeout(this.convertTimeout);
            this.convertTimeout = setTimeout(() => {
                this.bbcodeText = this.mdText ? window.markdown2Bbcode.convert(this.mdText) : '';
                this.$nextTick(() => {
                    this.updatePreview();
                });
            }, 300);
        },

        updatePreview() {
            if (!this._previewContainer) return;
            
            // 确保容器为空
            this._previewContainer.innerHTML = '';
            
            if (!this.bbcodeText) {
                // 创建空状态
                const emptyDiv = document.createElement('div');
                emptyDiv.style.cssText = 'color:#bbb;text-align:center;padding:80px 0;font-size:14px';
                emptyDiv.textContent = '预览效果将显示在这里...';
                this._previewContainer.appendChild(emptyDiv);
                return;
            }
            
            if (window.BBCode2Html) {
                try {
                    const html = window.BBCode2Html.replaceText(this.bbcodeText);
                    window.BBCode2Html.renderShadowDOM(this._previewContainer, html);
                } catch (error) {
                    console.error('预览渲染失败:', error);
                    const errorDiv = document.createElement('div');
                    errorDiv.style.cssText = 'color:#f56c6c;text-align:center;padding:80px 0;font-size:14px';
                    errorDiv.textContent = '预览渲染失败，请检查输入内容';
                    this._previewContainer.appendChild(errorDiv);
                }
            } else {
                const errorDiv = document.createElement('div');
                errorDiv.style.cssText = 'color:#f56c6c;text-align:center;padding:80px 0;font-size:14px';
                errorDiv.textContent = 'BBCode2Html 库未加载';
                this._previewContainer.appendChild(errorDiv);
            }
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
            this.mdText = content;
            this.handleInput();
        },

        handleGlobalFileDrop(event) {
            // 处理全局拖放事件
            const content = event.detail?.content;
            if (content) {
                this.handleFileDrop(content);
            }
        },

        refreshPreview() {
            // 立即执行转换，不使用防抖
            if (this.convertTimeout) {
                clearTimeout(this.convertTimeout);
            }
            this.bbcodeText = this.mdText ? window.markdown2Bbcode.convert(this.mdText) : '';
            this.$nextTick(() => {
                this.updatePreview();
            });
            this.$message.success('预览已刷新');
        },

        showBbcodeDialog() {
            if (!this.bbcodeText) {
                this.$message.warning('没有可复制的BBCode内容');
                return;
            }
            this.dialogVisible = true;
        },

        copyBbcodeFromDialog() {
            if (!this.bbcodeText) return;
            navigator.clipboard.writeText(this.bbcodeText).then(() => {
                this.$message.success('已复制到剪贴板');
                this.dialogVisible = false;
            }).catch(() => {
                this.$message.error('复制失败');
            });
        },




    }
};
