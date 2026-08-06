package com.codelife.aatmCollections;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class AatmCollectionsApplication {

	public static void main(String[] args) {
		SpringApplication.run(AatmCollectionsApplication.class, args);
	}
}
