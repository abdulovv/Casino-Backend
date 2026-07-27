package com.casino.cases_service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@EnableFeignClients
@SpringBootApplication
public class CasesServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(CasesServiceApplication.class, args);
	}

}
