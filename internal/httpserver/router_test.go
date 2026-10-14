package httpserver

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
)

func TestHealth(t *testing.T) {
	r, err := New("")
	if err != nil {
		t.Fatal(err)
	}
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/api/health", nil))
	var body map[string]string
	if err := json.Unmarshal(w.Body.Bytes(), &body); err != nil {
		t.Fatal(err)
	}
	if w.Code != 200 || body["status"] != "ok" || body["service"] != "b-web" {
		t.Fatalf("unexpected health: %d %v", w.Code, body)
	}
}

func TestProductionResources(t *testing.T) {
	dir := t.TempDir()
	if err := os.Mkdir(filepath.Join(dir, "assets"), 0755); err != nil {
		t.Fatal(err)
	}
	for name, content := range map[string]string{"index.html": "<html>b-web</html>", "assets/app.js": "console.log('ok')"} {
		if err := os.WriteFile(filepath.Join(dir, name), []byte(content), 0644); err != nil {
			t.Fatal(err)
		}
	}
	r, err := New(dir)
	if err != nil {
		t.Fatal(err)
	}
	for _, tc := range []struct {
		path   string
		status int
		cache  string
	}{
		{"/", 200, "no-cache"}, {"/assets/app.js", 200, "public, max-age=31536000, immutable"},
		{"/assets/missing.js", 404, ""}, {"/api/missing", 404, ""}, {"/api", 404, ""},
		{"/assets/", 404, ""}, {"/../go.mod", 404, ""},
	} {
		t.Run(tc.path, func(t *testing.T) {
			w := httptest.NewRecorder()
			r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, tc.path, nil))
			if w.Code != tc.status {
				t.Fatalf("status %d, want %d", w.Code, tc.status)
			}
			if tc.cache != "" && w.Header().Get("Cache-Control") != tc.cache {
				t.Fatalf("bad cache policy: %s", w.Header().Get("Cache-Control"))
			}
		})
	}
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodHead, "/", nil))
	if w.Code != 200 || w.Body.Len() != 0 {
		t.Fatal("HEAD should return no body")
	}
}

func TestMissingBuildFailsEarly(t *testing.T) {
	if _, err := New(t.TempDir()); err == nil {
		t.Fatal("missing build should be rejected")
	}
}
