#include <libyang/libyang.h>
#include <string.h>
#include <emscripten.h>


EMSCRIPTEN_KEEPALIVE
char* validate(const char* yang, const char* xml) {
    struct ly_ctx *ctx = NULL;
    struct lys_module *module = NULL;
    struct lyd_node *data = NULL;
    LY_ERR ret;
    char *result = NULL;

    // 1. Create context (3 parameters in current API)
    if (ly_ctx_new(NULL, 0, &ctx)) {
        return strdup("Context creation failed");
    }

    // 2. Parse YANG (4 parameters in current API)
    ret = lys_parse_mem(ctx, yang, LYS_IN_YANG, &module);
    if (ret != LY_SUCCESS) {
        result = strdup(ly_errmsg(ctx));
        goto cleanup;
    }

    // 3. Parse and validate XML
    ret = lyd_parse_data_mem(ctx, xml, LYD_XML, LYD_PARSE_ONLY | LYD_PARSE_STRICT, 0, &data);
    if (ret != LY_SUCCESS) {
        result = strdup(ly_errmsg(ctx));
        goto cleanup;
    }

    result = strdup("Validation successful");

cleanup:
    if (data) lyd_free_all(data);
    if (ctx) ly_ctx_destroy(ctx);
    return result;
}
