#include <libyang/libyang.h>
#include <string.h>
#include <emscripten.h>

EMSCRIPTEN_KEEPALIVE
char* validate(const char* yang, const char* xml) {
    struct ly_ctx *ctx = NULL;
    struct lyd_node *data = NULL;
    struct lys_module *mod = NULL;
    char *result = NULL;
    LY_ERR ret;
    const struct ly_err_item *err_item = NULL;

    // Create context (v2 API requires 3 parameters)
    ret = ly_ctx_new(NULL, 0, &ctx);
    if (ret != LY_SUCCESS) {
        return strdup("Failed to create context");
    }

    // Parse YANG schema (v2 API requires 4 parameters)
    ret = lys_parse_mem(ctx, yang, LYS_IN_YANG, &mod);
    if (ret != LY_SUCCESS) {
        result = strdup("Failed to parse YANG schema");
        goto cleanup;
    }

    // Parse and validate XML (v2 API requires 6 parameters)
    ret = lyd_parse_data_mem(ctx, xml, LYD_XML, 
                            LYD_PARSE_ONLY | LYD_PARSE_STRICT, 
                            0, &data);
    if (ret != LY_SUCCESS) {
        // Get the last error
        err_item = ly_err_last(ctx);
        if (err_item) {
            // Format error message with path
            const char *path = err_item->data_path ? err_item->data_path : "unknown";
            const char *msg = err_item->msg ? err_item->msg : "Unknown validation error";
            char *buf = malloc(strlen(msg) + strlen(path) + 32);
            sprintf(buf, "%s (data path: %s)", msg, path);
            result = buf;
        } else {
            result = strdup("Unknown validation error");
        }
        goto cleanup;
    }

    result = strdup("Validation successful");

cleanup:
    if (data) lyd_free_all(data);
    if (ctx) ly_ctx_destroy(ctx);
    return result;
}
