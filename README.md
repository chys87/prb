# Private Remote Browser

浏览远程文件的私有协议。可方便地预览远程服务器上的文件，支持对图片生成尺寸可调整的缩略图。

服务端（远程文件所在机器）需要安装 Python 3.5，本地编译需要最新版本的 Node.js，本地运行需要最新的 Google Chrome 浏览器。

本服务可以直接对外，但最好使用 nginx 代理一下，nginx 参考配置文件在 `server/nginx-proxy.conf`
