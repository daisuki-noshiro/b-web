package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"b-web/internal/httpserver"
)

func main() {
	addr := os.Getenv("BWEB_ADDR")
	if addr == "" {
		addr = "127.0.0.1:8080"
	}
	// 开发模式不托管前端；生产模式显式指定构建目录。
	router, err := httpserver.New(os.Getenv("BWEB_STATIC_DIR"))
	if err != nil {
		log.Fatal(err)
	}
	server := &http.Server{Addr: addr, Handler: router, ReadHeaderTimeout: 5 * time.Second, IdleTimeout: 60 * time.Second}
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	go func() {
		log.Printf("b-web listening on http://%s", addr)
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatal(err)
		}
	}()
	<-ctx.Done()
	shutdown, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := server.Shutdown(shutdown); err != nil {
		log.Printf("shutdown: %v", err)
	}
}
