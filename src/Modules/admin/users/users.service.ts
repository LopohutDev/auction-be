import { Injectable } from "@nestjs/common";
import { PrismaService } from 'src/Services/prisma.service';
import { successErrorDto, successReturnDto } from 'src/dto/common.dto';
import { usersQueryDataDto } from "src/dto/admin.location.module.dto";
import { validateUsersBody } from "src/validations/admin.location.validations";

@Injectable()
export class AdminUsersService {

    constructor(private readonly prismaService: PrismaService) { }

    async acceptAdminUser(
        userinfo: usersQueryDataDto,
    ): Promise<successReturnDto> {
        const { data, error } = validateUsersBody(userinfo);
        if (error) {
            return { error };
        }
        try {
            if(data.type=="accept"){

                await this.prismaService.user.update({
                    where: { id: data.id },
                    data: {
                        account: 'ACCEPTED',
                    },
                });
                return {
                    success: true,
                    message: 'Successfully Verified Account.'
            
                };
            } else if (data.type == "reject"){
                await this.prismaService.user.update({
                    where: { id: data.id },
                    data: {
                        account: 'REJECTED',
                        rejectedreason:'wrong user'
                        
                    },
                });
                return {
                    success: true,
                    message: 'Successfully rejected Account.'
                };
            } else if (data.type == "delete") {
                await this.prismaService.user.update({
                    where: { id: data.id },
                    data: {
                        account: 'DELETED',
                    },
                });
                return {
                    success: true,
                    message: 'Successfully Deleted Account.'
                };
            }else{
                return { error: { status: 422, message: 'type is not valid' } };
            }
        } catch (error) {
            return { error: { status: 422, message: 'User id is not valid' } };
        }
    }
    async listAdminUser() {
        try {
            const data = await this.prismaService.user.findMany({
                where: {
                    account: {
                        not: 'DELETED',
                    } },
                select: {
                    createdAt: true,
                    firstname: true,
                    lastname: true,
                    email: true,
                    account: true,
                    location:true,
                },
            });
            return { data };
        } catch (error) {
            return { error: { status: 422, message: 'users not found' } };
        }
    }
}
