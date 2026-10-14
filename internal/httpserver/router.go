// Package httpserver 管理 HTTP 路由、API 与可选的生产静态资源。
package httpserver

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
)

func New(staticDir string) (*gin.Engine, error) {
	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery())
	api := r.Group("/api")
	api.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "service": "b-web"})
	})
	// 后续在 api 分组注册 memories / wishes，并在需要时添加访问验证中间件。
	// 私人照片应通过受控 API 返回；不要放入公开静态目录。
	if staticDir == "" {
		r.NoRoute(apiNotFound)
		return r, nil
	}
	abs, err := filepath.Abs(staticDir)
	if err != nil {
		return nil, err
	}
	index := filepath.Join(abs, "index.html")
	if info, err := os.Stat(index); err != nil || info.IsDir() {
		return nil, fmt.Errorf("BWEB_STATIC_DIR must contain built index.html: %s", abs)
	}
	// 只服务构建目录中的常规文件；禁止目录索引与符号链接逃逸。
	r.NoRoute(func(c *gin.Context) {
		if c.Request.URL.Path == "/api" || strings.HasPrefix(c.Request.URL.Path, "/api/") {
			apiNotFound(c)
			return
		}
		if c.Request.Method != http.MethodGet && c.Request.Method != http.MethodHead {
			c.Status(http.StatusMethodNotAllowed)
			return
		}
		path := c.Request.URL.Path
		if path == "/" {
			path = "/index.html"
		}
		candidate := filepath.Join(abs, filepath.FromSlash(strings.TrimPrefix(path, "/")))
		resolved, err := filepath.EvalSymlinks(candidate)
		if err != nil || !inside(abs, resolved) {
			c.Status(http.StatusNotFound)
			return
		}
		info, err := os.Stat(resolved)
		if err != nil || !info.Mode().IsRegular() {
			c.Status(http.StatusNotFound)
			return
		}
		if strings.HasPrefix(path, "/assets/") {
			c.Header("Cache-Control", "public, max-age=31536000, immutable")
		} else {
			c.Header("Cache-Control", "no-cache")
		}
		c.File(resolved)
	})
	return r, nil
}

func inside(root, path string) bool {
	rel, err := filepath.Rel(root, path)
	return err == nil && rel != ".." && !strings.HasPrefix(rel, ".."+string(filepath.Separator)) && !filepath.IsAbs(rel)
}

func apiNotFound(c *gin.Context) {
	c.JSON(http.StatusNotFound, gin.H{"error": "not_found"})
}
