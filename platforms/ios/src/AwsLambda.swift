import Foundation
import Cordova
import AWSCore
import AWSLambda

fileprivate func log(_ msg: String) {
    print(msg)
}

@objc(AwsLambda)
class AwsLambda: CDVPlugin {
    // MARK: - Plugin Commands

    func invoke(_ command: CDVInvokedUrlCommand) {
        fork(command) {
            let funcName = self.getString(0)
            let param = self.getString(1)
            
            let names = funcName.components(separatedBy: ":")
            let req = AWSLambdaInvokerInvocationRequest()!
            req.functionName = names[0]
            req.payload = param
            if names.count > 1 {
                req.qualifier = names[1]
            }
            
            self.withTask(AWSLambdaInvoker.default().invoke(req)) { res in
                if let code = res.statusCode?.intValue {
                    if code % 100 != 2 {
                        self.finish_error("Http error: \(code)")
                    } else {
                        if let error = res.functionError {
                            self.finish_error(error)
                        } else {
                            self.finish_ok(res.payload)
                        }
                    }
                } else {
                    self.finish_error("No response")
                }
            }
        }
    }

    // MARK: - Private Utillities

    private func withTask<T>(_ task: AWSTask<T>, _ callback: ((_ res: T) -> Void)? = nil) {
        task.continue({ task in
            if let error = task.error {
                self.finish_error(error.localizedDescription)
            } else {
                if let callback = callback {
                    if let result = task.result {
                        callback(result)
                    } else {
                        self.finish_error("No result")
                    }
                } else {
                    self.finish_ok()
                }
            }
            return nil
        })
    }

    private var currentCommand: CDVInvokedUrlCommand?

    lazy private var infoDict: [String : String]? = Bundle.main.infoDictionary?["CordovaAWS"] as? [String : String]

    private func getString(_ index: UInt) -> String {
        return currentCommand!.argument(at: index) as! String
    }

    private func fork(_ command: CDVInvokedUrlCommand, _ proc: @escaping () throws -> Void) {
        DispatchQueue.global(qos: DispatchQoS.QoSClass.utility).async(execute: {
            self.currentCommand = command
            defer {
                self.currentCommand = nil
            }
            do {
                try proc()
            } catch (let ex) {
                self.finish_error(ex.localizedDescription)
            }
        })
    }

    private func finish_error(_ msg: String!) {
        if let command = self.currentCommand {
            commandDelegate!.send(CDVPluginResult(status: CDVCommandStatus_ERROR, messageAs: msg), callbackId: command.callbackId)
        }
    }

    private func finish_ok(_ result: Any? = nil) {
        if let command = self.currentCommand {
            log("Command Result: \(result)")
            if let msg = result as? String {
                commandDelegate!.send(CDVPluginResult(status: CDVCommandStatus_OK, messageAs: msg), callbackId: command.callbackId)
            } else if let b = result as? Bool {
                commandDelegate!.send(CDVPluginResult(status: CDVCommandStatus_OK, messageAs: b), callbackId: command.callbackId)
            } else if let array = result as? [Any] {
                commandDelegate!.send(CDVPluginResult(status: CDVCommandStatus_OK, messageAs: array), callbackId: command.callbackId)
            } else if let dict = result as? [String: AnyObject] {
                commandDelegate!.send(CDVPluginResult(status: CDVCommandStatus_OK, messageAs: dict), callbackId: command.callbackId)
            } else {
                commandDelegate!.send(CDVPluginResult(status: CDVCommandStatus_OK), callbackId: command.callbackId)
            }
        }
    }
}
