import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as fs from 'fs';

// =====================================================================
// EXHAUSTIVE DATA SCHEMA MAP
// Maps NestJS Controller method names (operationIds) to exact data schemas
// =====================================================================
const responseDataSchemas: Record<string, any> = {
  // --- AUTH MODULE ---
  AuthController_registerWarga: {
    type: 'object',
    properties: {
      user_id: { type: 'string' },
      role: { type: 'string' },
      access_token: { type: 'string' },
      refresh_token: { type: 'string' },
    },
  },
  AuthController_registerLinmas: {
    type: 'object',
    properties: {
      linmas_id: { type: 'string' },
      role: { type: 'string' },
    },
  },
  AuthController_login: {
    type: 'object',
    properties: {
      user_id: { type: 'string' },
      full_name: { type: 'string' },
      role: { type: 'string' },
      access_token: { type: 'string' },
      refresh_token: { type: 'string' },
      expires_in: { type: 'number' },
    },
  },
  AuthController_refreshToken: {
    type: 'object',
    properties: { access_token: { type: 'string' } },
  },

  // --- HOME MODULE ---
  HomeController_getKoordinatorHome: {
    type: 'object',
    properties: {
      role: { type: 'string' },
      summary: {
        type: 'object',
        properties: {
          active_incidents: { type: 'number' },
          total_linmas: { type: 'number' },
          today_shifts_count: { type: 'number' },
        },
      },
    },
  },
  HomeController_getLinmasHome: {
    type: 'object',
    properties: {
      role: { type: 'string' },
      summary: {
        type: 'object',
        properties: {
          regu_name: { type: 'string', nullable: true },
          active_incidents: { type: 'number' },
          has_shift_today: { type: 'boolean' },
          shift_detail: {
            type: 'object',
            nullable: true,
            properties: {
              shift_type: { type: 'string' },
              start_time: { type: 'string', format: 'date-time' },
              end_time: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
  },
  HomeController_getWargaHome: {
    type: 'object',
    properties: {
      role: { type: 'string' },
      summary: {
        type: 'object',
        properties: { my_active_reports: { type: 'number' } },
      },
    },
  },

  // --- PROFILE MODULE (UPDATED: FLAT JSON) ---
  ProfileController_getMyProfile: {
    type: 'object',
    properties: {
      user_id: { type: 'string' },
      email: { type: 'string' },
      phone_number: { type: 'string' },
      role: { type: 'string' },
      full_name: { type: 'string' },
      address: { type: 'string', nullable: true },
      // LINMAS fields
      employment_date: { type: 'string', format: 'date', nullable: true },
      regu_name: { type: 'string', nullable: true },
      current_sanction_level: { type: 'string', nullable: true },
      // WARGA fields
      total_incidents_reported: { type: 'number', nullable: true },
    },
  },

  // --- SHIFTS MODULE ---
  ShiftsController_createShift: {
    type: 'object',
    properties: { shift_id: { type: 'string' } },
  },
  ShiftsController_createBulkShifts: {
    type: 'object',
    properties: {
      total_created: { type: 'number' },
      shift_ids: { type: 'array', items: { type: 'string' } },
    },
  },
  ShiftsController_getShifts: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        shift_id: { type: 'string' },
        shift_date: { type: 'string', format: 'date' },
        shift_type: { type: 'string' },
        regu_name: { type: 'string', nullable: true },
        assigned_officers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              linmas_id: { type: 'string' },
              full_name: { type: 'string' },
              is_substitute: { type: 'boolean' },
            },
          },
        },
      },
    },
  },
  ShiftsController_getMyShifts: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        shift_id: { type: 'string' },
        shift_date: { type: 'string', format: 'date' },
        shift_type: { type: 'string' },
        start_time: { type: 'string' },
        end_time: { type: 'string' },
        regu_name: { type: 'string', nullable: true },
        is_substitute: { type: 'boolean' },
      },
    },
  },
  ShiftsController_assignSubstitute: {
    type: 'object',
    properties: {
      shift_id: { type: 'string' },
      original_linmas_id: { type: 'string' },
      substitute_linmas_id: { type: 'string' },
      bonus_amount: { type: 'number' },
    },
  },

  // --- REGU MODULE ---
  ReguController_createRegu: {
    type: 'object',
    properties: { regu_id: { type: 'string' } },
  },
  ReguController_getRegus: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        regu_id: { type: 'string' },
        name: { type: 'string' },
        description: { type: 'string' },
        total_members: { type: 'number' },
        created_at: { type: 'string', format: 'date-time' },
      },
    },
  },
  ReguController_getReguById: {
    type: 'object',
    properties: {
      regu_id: { type: 'string' },
      name: { type: 'string' },
      description: { type: 'string' },
      members: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            linmas_id: { type: 'string' },
            full_name: { type: 'string' },
            phone_number: { type: 'string' },
          },
        },
      },
    },
  },

  // --- USERS MODULE ---
  UsersController_getUsers: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        user_id: { type: 'string' },
        role: { type: 'string' },
        full_name: { type: 'string' },
        email: { type: 'string' },
        phone_number: { type: 'string' },
      },
    },
  },

  // --- ATTENDANCE MODULE ---
  AttendanceController_getStatus: {
    type: 'object',
    properties: {
      status: { type: 'string' },
      message: { type: 'string' },
      shift_assignment_id: { type: 'string', nullable: true },
      attendance_session_id: { type: 'string', nullable: true },
    },
  },
  AttendanceController_getGeofence: {
    type: 'object',
    properties: {
      geofence_id: { type: 'string' },
      latitude: { type: 'number' },
      longitude: { type: 'number' },
      radius_meters: { type: 'number' },
    },
  },
  AttendanceController_clockIn: {
    type: 'object',
    properties: {
      attendance_session_id: { type: 'string' },
      attendance_status: { type: 'string' },
      verified_distance_meters: { type: 'number' },
      photo_url: { type: 'string' },
    },
  },
  AttendanceController_clockOut: {
    type: 'object',
    properties: {
      attendance_session_id: { type: 'string' },
      verified_distance_meters: { type: 'number' },
      clock_out_time: { type: 'string', format: 'date-time' },
      photo_url: { type: 'string' },
    },
  },
  AttendanceController_getRecap: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        linmas_id: { type: 'string' },
        full_name: { type: 'string' },
        regu_name: { type: 'string', nullable: true },
        present_count: { type: 'number' },
        absent_count: { type: 'number' },
        late_count: { type: 'number' },
      },
    },
  },

  // --- STORAGE MODULE (REDUCED) ---
  StorageController_getFileMetadata: {
    type: 'object',
    properties: {
      file_id: { type: 'string' },
      cdn_url: { type: 'string' },
      mime_type: { type: 'string' },
    },
  },
  StorageController_getPrivateFileView: {
    type: 'object',
    properties: {
      file_id: { type: 'string' },
      private_url: { type: 'string' },
      expires_in: { type: 'number' },
    },
  },
  StorageController_getMultiplePrivateFileViews: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        file_id: { type: 'string' },
        private_url: { type: 'string' },
        expires_in: { type: 'number' },
      },
    },
  },

  // --- PATROLS MODULE (HEAVILY UPDATED) ---
  PatrolsController_getCheckpoints: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        checkpoint_id: { type: 'string' },
        name: { type: 'string' },
        description: { type: 'string', nullable: true },
        latitude: { type: 'number' },
        longitude: { type: 'number' },
        radius: { type: 'number' },
        block: { type: 'string', nullable: true },
        rt: { type: 'string', nullable: true },
      },
    },
  },
  PatrolsController_visitCheckpoint: {
    type: 'object',
    properties: {
      visit_id: { type: 'string' },
      verified_distance: { type: 'number' },
      entered_at: { type: 'string', format: 'date-time' },
    },
  },
  PatrolsController_getVisitHistory: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        visit_id: { type: 'string' },
        checkpoint_id: { type: 'string' },
        checkpoint_name: { type: 'string' },
        entered_at: { type: 'string', format: 'date-time' },
      },
    },
  },
  PatrolsController_getPatrolSummary: {
    type: 'object',
    properties: {
      visited: { type: 'number' },
      total: { type: 'number' },
      percentage: { type: 'number' },
    },
  },
  PatrolsController_createPatrolReport: {
    type: 'object',
    properties: {
      patrol_id: { type: 'string' },
      photo_url: { type: 'string' },
    },
  },
  PatrolsController_getPatrolReports: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        patrol_id: { type: 'string' },
        reporter: {
          type: 'object',
          properties: {
            linmas_id: { type: 'string' },
            full_name: { type: 'string' },
            regu_name: { type: 'string', nullable: true },
          },
        },
        patrol_type: { type: 'string' },
        description: { type: 'string' },
        location: {
          type: 'object',
          properties: {
            latitude: { type: 'number' },
            longitude: { type: 'number' },
          },
        },
        reported_at: { type: 'string', format: 'date-time' },
      },
    },
  },
  PatrolsController_getPatrolReportDetail: {
    type: 'object',
    properties: {
      patrol_id: { type: 'string' },
      reporter: {
        type: 'object',
        properties: {
          linmas_id: { type: 'string' },
          full_name: { type: 'string' },
          regu_name: { type: 'string', nullable: true },
        },
      },
      patrol_type: { type: 'string' },
      description: { type: 'string' },
      location: {
        type: 'object',
        properties: {
          latitude: { type: 'number' },
          longitude: { type: 'number' },
        },
      },
      photo_url: { type: 'string' },
      url_expires_in_seconds: { type: 'number' },
      reported_at: { type: 'string', format: 'date-time' },
    },
  },

  // --- INCIDENTS MODULE ---
  IncidentsController_createIncident: {
    type: 'object',
    properties: {
      incident_id: { type: 'string' },
      status: { type: 'string' },
      photo_url: { type: 'string' },
    },
  },
  IncidentsController_getIncidents: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        incident_id: { type: 'string' },
        title: { type: 'string' },
        status: { type: 'string' },
        reported_at: { type: 'string', format: 'date-time' },
        handler: {
          type: 'object',
          nullable: true,
          properties: {
            linmas_id: { type: 'string' },
            full_name: { type: 'string' },
          },
        },
      },
    },
  },
  IncidentsController_getActiveIncidents: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        incident_id: { type: 'string' },
        title: { type: 'string' },
        status: { type: 'string' },
        reported_at: { type: 'string', format: 'date-time' },
        handler: {
          type: 'object',
          nullable: true,
          properties: {
            linmas_id: { type: 'string' },
            full_name: { type: 'string' },
          },
        },
      },
    },
  },
  IncidentsController_getMyIncidents: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        incident_id: { type: 'string' },
        title: { type: 'string' },
        status: { type: 'string' },
        reported_at: { type: 'string', format: 'date-time' },
        handler: { type: 'string', nullable: true },
        rating: { type: 'number', nullable: true },
      },
    },
  },
  IncidentsController_getIncidentDetail: {
    type: 'object',
    properties: {
      incident_id: { type: 'string' },
      title: { type: 'string' },
      description: { type: 'string' },
      status: { type: 'string' },
      location: {
        type: 'object',
        properties: {
          latitude: { type: 'number' },
          longitude: { type: 'number' },
        },
      },
      reporter: {
        type: 'object',
        properties: {
          warga_id: { type: 'string' },
          full_name: { type: 'string' },
          address: { type: 'string' },
        },
      },
      handler: {
        type: 'object',
        nullable: true,
        properties: {
          linmas_id: { type: 'string' },
          full_name: { type: 'string' },
        },
      },
      photo_url: { type: 'string' },
      url_expires_in_seconds: { type: 'number' },
      reported_at: { type: 'string', format: 'date-time' },
      handled_at: { type: 'string', format: 'date-time', nullable: true },
      resolved_at: { type: 'string', format: 'date-time', nullable: true },
      rating: {
        type: 'object',
        nullable: true,
        properties: {
          score: { type: 'number' },
          review: { type: 'string', nullable: true },
          rated_at: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  IncidentsController_claimIncident: {
    type: 'object',
    properties: {
      incident_id: { type: 'string' },
      status: { type: 'string' },
      handler_name: { type: 'string' },
    },
  },
  IncidentsController_createIncidentRating: {
    type: 'object',
    properties: {
      rating_id: { type: 'string' },
      score: { type: 'number' },
    },
  },

  // --- VIOLATIONS MODULE ---
  ViolationsController_createViolation: {
    type: 'object',
    properties: { violation_id: { type: 'string' } },
  },
  ViolationsController_getViolations: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        violation_id: { type: 'string' },
        linmas_name: { type: 'string' },
        issued_by: { type: 'string' },
        violation_type: { type: 'string' },
        sanction_level: { type: 'string' },
        incident_date: { type: 'string', format: 'date' },
      },
    },
  },

  // --- SALARIES MODULE ---
  SalariesController_getAllAdjustments: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        linmas_id: { type: 'string' },
        full_name: { type: 'string' },
        regu_name: { type: 'string', nullable: true },
        total_bonuses: { type: 'number' },
        total_deductions: { type: 'number' },
        net_adjustment: { type: 'number' },
        is_approved: { type: 'boolean' },
        approved_at: { type: 'string', format: 'date-time', nullable: true },
        bonus_details: { type: 'array', items: { type: 'object' } },
        deduction_details: { type: 'array', items: { type: 'object' } },
      },
    },
  },

  // --- PERFORMANCE MODULE (NEW) ---
  PerformanceController_getAllEvaluations: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        linmas_id: { type: 'string' },
        nama_anggota: { type: 'string' },
        periode: { type: 'string' },
        metrik: {
          type: 'object',
          properties: {
            presensi: {
              type: 'object',
              properties: {
                jadwal_shift: { type: 'number' },
                presensi_valid: { type: 'number' },
                status: { type: 'string' },
              },
            },
            patroli: {
              type: 'object',
              properties: {
                jumlah_shift_hadir: { type: 'number' },
                shift_memenuhi_checkpoint: { type: 'number' },
                status: { type: 'string' },
              },
            },
            pelayanan: {
              type: 'object',
              properties: {
                laporan_ditangani: { type: 'number' },
                rata_rata_rating: { type: 'number' },
                status: { type: 'string' },
              },
            },
          },
        },
        kategori_kinerja: { type: 'string' },
      },
    },
  },
  PerformanceController_getMyEvaluation: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        linmas_id: { type: 'string' },
        nama_anggota: { type: 'string' },
        periode: { type: 'string' },
        metrik: {
          type: 'object',
          properties: {
            presensi: {
              type: 'object',
              properties: {
                jadwal_shift: { type: 'number' },
                presensi_valid: { type: 'number' },
                status: { type: 'string' },
              },
            },
            patroli: {
              type: 'object',
              properties: {
                jumlah_shift_hadir: { type: 'number' },
                shift_memenuhi_checkpoint: { type: 'number' },
                status: { type: 'string' },
              },
            },
            pelayanan: {
              type: 'object',
              properties: {
                laporan_ditangani: { type: 'number' },
                rata_rata_rating: { type: 'number' },
                status: { type: 'string' },
              },
            },
          },
        },
        kategori_kinerja: { type: 'string' },
      },
    },
  },
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: false });

  const config = new DocumentBuilder()
    .setTitle('MANALINMAS API - Strict Contract')
    .setDescription(
      'Highly Detailed API Contract with Global Envelopes and Standard Errors',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Programmatically enhance the OpenAPI AST
  for (const path in document.paths) {
    for (const method in document.paths[path]) {
      const operation = document.paths[path][method];
      const opId = operation.operationId;

      // 1. Determine the specific 'data' schema for this endpoint
      const dataSchema = responseDataSchemas[opId] || { type: 'object' };

      // 2. Wrap all Success Responses (200 / 201) in { success, message, data }
      const successCodes = ['200', '201'];
      for (const code of successCodes) {
        if (operation.responses[code]) {
          operation.responses[code] = {
            description:
              operation.responses[code].description || 'Operation successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: {
                      type: 'string',
                      example: 'Operation successful',
                    },
                    data: dataSchema,
                  },
                  required: ['success', 'message', 'data'],
                },
              },
            },
          };
        }
      }

      // 3. Inject Standard Error Contracts globally
      operation.responses['400'] = {
        description: 'Bad Request / Validation Error',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: false },
                message: { type: 'string', example: 'Validation failed' },
                errors: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      field: { type: 'string' },
                      message: { type: 'string' },
                    },
                  },
                },
              },
              required: ['success', 'message'],
            },
          },
        },
      };

      operation.responses['401'] = {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: false },
                message: {
                  type: 'string',
                  example: 'Invalid or missing access token',
                },
              },
              required: ['success', 'message'],
            },
          },
        },
      };

      operation.responses['403'] = {
        description: 'Forbidden',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: false },
                message: {
                  type: 'string',
                  example: 'Insufficient permissions',
                },
              },
              required: ['success', 'message'],
            },
          },
        },
      };
    }
  }

  fs.writeFileSync('./openapi.json', JSON.stringify(document, null, 2));
  console.log(
    '✅ Highly detailed OpenAPI specification exported to openapi.json',
  );

  await app.close();
  process.exit(0);
}

bootstrap();
