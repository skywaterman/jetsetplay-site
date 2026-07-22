# JSP PDF renderer

This private service renders the validated `proposal.v1` document as an A4 one-sheet PDF. It accepts structured JSON only. It never accepts HTML or CSS from a caller and never fetches external resources.

## Runtime contract

- `GET /health` returns service health.
- `POST /render/one-sheet` accepts the exact `proposal.v1` object and returns `application/pdf`.
- `PDF_RENDERER_SECRET` must contain at least 32 bytes and must be shared only with the calling site service.
- `PORT` selects the listening port. Vercel supplies this value.

The caller sends Unix seconds in `x-jsp-timestamp`. It sends lowercase hexadecimal HMAC-SHA256 in `x-jsp-signature`. The signed bytes are the UTF-8 timestamp, a period, and the raw request body without modification.

Requests more than five minutes from the renderer clock are rejected. Bodies are limited to 32 KiB. Extra JSON properties, unsafe client palettes, internal language, external resource references, banned filler, unsupported punctuation, and irregular text are rejected.

## Container

`Dockerfile.vercel` pins Python 3.12.13 by manifest digest on Debian Bookworm. The Python render stack is fully version-pinned, including WeasyPrint 69.0 and its transitive packages. The container installs the Debian Pango and HarfBuzz runtime packages documented by WeasyPrint and runs as an unprivileged user.

The container build has a dedicated verification stage. It runs the complete renderer and authenticated HTTP contract suite on Debian before the final unprivileged runtime image can be produced. Test files are not copied into the final stage.

The primary font files are static TTF instances assembled with fontTools from the installed `@fontsource/cormorant-garamond` and `@fontsource/instrument-sans` packages. Their original SIL Open Font License notices are included in `fonts/`. The container adds DejaVu and Noto CJK only as fallbacks for characters outside the primary families.

The Vercel project must declare this directory as a container service and bind the site service to it. No public rewrite should target this renderer.
