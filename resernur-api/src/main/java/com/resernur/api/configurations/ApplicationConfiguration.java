package com.resernur.api.configurations;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ApplicationConfiguration {

    @Bean
    public org.springframework.web.servlet.config.annotation.WebMvcConfigurer webMvcConfigurer() {
        return new org.springframework.web.servlet.config.annotation.WebMvcConfigurer() {
            @Override
            public void addViewControllers(org.springframework.web.servlet.config.annotation.ViewControllerRegistry registry) {
                registry.addRedirectViewController("/", "/api/");
            }
        };
    }
}
