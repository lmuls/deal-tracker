package com.lmuls.dealtracker.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * Forwards all non-API, non-static-asset requests to {@code index.html}
 * so that React Router handles client-side navigation.
 *
 * The pattern {@code /{path:[^\\.]*}} matches any path segment that does NOT
 * contain a dot (i.e. not a static file like {@code bundle.js}).  Deeper
 * paths (e.g. {@code /sites/123}) are caught by the multi-segment variant.
 */
@Controller
public class SpaController {

    @RequestMapping(value = {"/{path:[^\\.]*}", "/{path:[^\\.]*}/**"})
    public String forward() {
        return "forward:/index.html";
    }
}
