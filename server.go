package main

import (
	"io"
	"net/http"
)

func main() {
	http.HandleFunc("/proxy", func(w http.ResponseWriter, r *http.Request) {
		req, err := http.NewRequest(
			r.Method,
			r.Header.Get("X-Proxy-URL"),
			r.Body,
		)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}

		for k, v := range r.Header {
			if len(k) > 8 && k[:8] == "X-Proxy-" && k != "X-Proxy-URL" {
				req.Header.Set(k[8:], v[0])
			}
		}

		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		defer resp.Body.Close()

		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Content-Type", resp.Header.Get("Content-Type"))
		w.WriteHeader(resp.StatusCode)

		io.Copy(w, resp.Body)
	})

	http.Handle("/", http.FileServer(http.Dir("./src")))

	println("http://127.0.0.1:3000")
	panic(http.ListenAndServe("127.0.0.1:3000", nil))
}